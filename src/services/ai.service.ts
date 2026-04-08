import { generateText, Output } from 'ai';
import { z } from 'zod';

const MODEL = 'anthropic/claude-haiku-4.5';

const categorizationSchema = z.object({
  category: z.enum([
    'health', 'family', 'financial', 'grief', 'gratitude',
    'guidance', 'relationships', 'work_career', 'spiritual_growth', 'other',
  ]),
  tags: z.array(z.string()).max(5),
  verse: z.string(),
});

const moderationSchema = z.object({
  safe: z.boolean(),
  reason: z.string().optional(),
  selfHarm: z.boolean().default(false),
});

export async function categorizePrayer(content: string) {
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: categorizationSchema }),
    prompt: `Categorize this prayer request for a Christian prayer website.

Return:
- category: the single best category from the enum
- tags: up to 5 specific descriptive tags (lowercase, e.g. "surgery", "job loss")
- verse: one relevant Bible verse reference (e.g. "Isaiah 41:10" or "Psalm 23:1")

Prayer: "${content}"`,
  });
  if (!output) throw new Error('AI categorization returned no output');
  return output;
}

export async function moderateContent(content: string): Promise<{
  safe: boolean;
  reason?: string;
  selfHarm: boolean;
}> {
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: moderationSchema }),
    prompt: `Review this content for a Christian prayer website. Most prayer requests are genuine and should be marked safe.

Flag as unsafe only if the content contains: spam/advertisements, hate speech, explicit sexual content, harassment targeting a specific person, or content unrelated to prayer/faith.

Set selfHarm: true if the content suggests the person may be in crisis or considering self-harm (so we can show crisis resources).

Content: "${content}"`,
  });
  if (!output) throw new Error('AI moderation returned no output');
  return { selfHarm: false, ...output };
}
