import { generateText, Output, gateway } from 'ai';
import { z } from 'zod';

const MODEL = gateway('anthropic/claude-haiku-4.5');

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
  return output;
}

export async function generateEncouragement(
  prayerContent: string,
  verse: string
): Promise<{ encouragement: string }> {
  try {
    const truncatedContent = prayerContent.slice(0, 200);
    const { text } = await generateText({
      model: MODEL,
      system:
        'You are a compassionate Christian encourager. Your role is to affirm and warm the hearts of people who have just prayed for others. Speak directly to the intercessor — the person who just prayed. Be genuine, personal, and grounded in scripture. Write in plain prose with no markdown, no quotation marks, and no greeting salutation.',
      prompt: `Someone just finished praying for this request: "${truncatedContent}"

The Bible verse connected to this prayer is: ${verse}

Write a warm, personal 2-3 sentence encouragement for the person who just prayed. Acknowledge what they did, connect it to the verse, and leave them feeling affirmed. Plain text only — no markdown, no quotes.`,
      temperature: 0.7,
      maxTokens: 150,
    });
    return { encouragement: text.trim() };
  } catch {
    return {
      encouragement:
        'Your prayer matters. Thank you for interceding for others.',
    };
  }
}

export async function moderateImage(imageUrl: string): Promise<{
  safe: boolean;
  reason?: string;
}> {
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({
      schema: z.object({
        safe: z.boolean(),
        reason: z.string().optional(),
      }),
    }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Review this image for a Christian prayer website. Mark as unsafe only if it contains: nudity, graphic violence, hate symbols, explicit content, or spam/advertisements. Most prayer-related photos (people, nature, hospitals, churches) are safe.',
          },
          {
            type: 'image',
            image: imageUrl,
          },
        ],
      },
    ],
  });
  if (!output) throw new Error('AI image moderation returned no output');
  return output;
}
