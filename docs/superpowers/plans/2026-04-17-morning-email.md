# Morning Email (Daily Verse + Activity) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `daily-brief` cron with a redesigned morning email that opens with a verse of the day, shows a personalized activity summary (prayers received, encouragements, streak — only non-zero stats), and presents 3 prayers to pray for.

**Architecture:** New cron at `src/app/api/cron/morning-email/route.ts` replaces `daily-brief`. A verse library at `src/lib/verses.ts` selects today's verse deterministically by day-of-year. A new React Email template at `src/emails/morning-email.tsx` renders all three sections. The old `daily-brief` cron and template are deleted; `vercel.json` is updated to point to the new route at the same schedule.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM (PostgreSQL), Resend + @react-email/components, Vitest, Sentry

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/lib/verses.ts` | 365 verses + `getDayVerse(date?)` |
| Create | `src/lib/verses.test.ts` | Unit tests for verse selection |
| Create | `src/emails/morning-email.tsx` | React Email template (Designer + Frontend own polish) |
| Create | `src/app/api/cron/morning-email/route.ts` | Cron handler |
| Create | `src/app/api/cron/morning-email/route.test.ts` | Integration tests |
| Modify | `vercel.json` | Replace `daily-brief` schedule entry with `morning-email` |
| Delete | `src/app/api/cron/daily-brief/route.ts` | Superseded |
| Delete | `src/emails/daily-brief.tsx` | Superseded |

---

## Task 1: Verse Library

**Files:**
- Create: `src/lib/verses.ts`
- Create: `src/lib/verses.test.ts`

### Codebase context

Read `src/db/schema.ts` lines 35–55 for the users table shape. No DB interaction in this task — purely a data file + utility function.

---

- [ ] **Step 1: Write the failing tests**

Create `src/lib/verses.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getDayVerse, verses } from './verses';

describe('verses array', () => {
  it('has at least 365 entries', () => {
    expect(verses.length).toBeGreaterThanOrEqual(365);
  });

  it('every entry has non-empty text and reference', () => {
    for (const verse of verses) {
      expect(verse.text.length, `empty text at index ${verses.indexOf(verse)}`).toBeGreaterThan(0);
      expect(verse.reference.length, `empty ref at index ${verses.indexOf(verse)}`).toBeGreaterThan(0);
    }
  });
});

describe('getDayVerse', () => {
  it('returns a valid verse for Jan 1', () => {
    const result = getDayVerse(new Date(2024, 0, 1));
    expect(result.text).toBeTruthy();
    expect(result.reference).toBeTruthy();
  });

  it('returns a valid verse for Dec 31', () => {
    const result = getDayVerse(new Date(2024, 11, 31));
    expect(result.text).toBeTruthy();
    expect(result.reference).toBeTruthy();
  });

  it('returns different verses for consecutive days', () => {
    const day1 = getDayVerse(new Date(2024, 0, 1));
    const day2 = getDayVerse(new Date(2024, 0, 2));
    expect(day1.reference).not.toBe(day2.reference);
  });

  it('returns fallback verse when verses array is emptied', () => {
    const saved = verses.splice(0, verses.length);
    const result = getDayVerse();
    verses.push(...saved);
    expect(result.reference).toBe('1 Peter 5:7');
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/lib/verses.test.ts
```

Expected: FAIL — `Cannot find module './verses'`

- [ ] **Step 3: Create `src/lib/verses.ts`**

```typescript
export interface Verse {
  text: string;
  reference: string;
}

function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const FALLBACK_VERSE: Verse = {
  text: 'Cast all your anxiety on him because he cares for you.',
  reference: '1 Peter 5:7',
};

export const verses: Verse[] = [
  { text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', reference: 'Jeremiah 29:11' },
  { text: 'I can do all this through him who gives me strength.', reference: 'Philippians 4:13' },
  { text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', reference: 'Proverbs 3:5-6' },
  { text: 'The Lord is my shepherd, I lack nothing.', reference: 'Psalm 23:1' },
  { text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', reference: 'Joshua 1:9' },
  { text: 'Come to me, all you who are weary and burdened, and I will give you rest.', reference: 'Matthew 11:28' },
  { text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', reference: 'John 3:16' },
  { text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', reference: 'Philippians 4:6' },
  { text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', reference: 'Romans 8:28' },
  { text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', reference: 'Psalm 34:18' },
  { text: 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.', reference: 'Psalm 55:22' },
  { text: 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God.', reference: 'Romans 8:38-39' },
  { text: 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.', reference: 'Zephaniah 3:17' },
  { text: 'He gives strength to the weary and increases the power of the weak.', reference: 'Isaiah 40:29' },
  { text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', reference: 'Isaiah 40:31' },
  { text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', reference: 'John 14:27' },
  { text: 'The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.', reference: 'Lamentations 3:22-23' },
  { text: 'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.', reference: 'Matthew 7:7' },
  { text: 'I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.', reference: 'Psalm 139:14' },
  { text: 'Be still, and know that I am God.', reference: 'Psalm 46:10' },
  { text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.', reference: '1 Corinthians 13:4' },
  { text: 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.', reference: 'James 1:5' },
  { text: 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.', reference: 'Numbers 6:24-25' },
  { text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', reference: '2 Timothy 1:7' },
  { text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.', reference: 'Matthew 6:33' },
  { text: 'The name of the Lord is a fortified tower; the righteous run to it and are safe.', reference: 'Proverbs 18:10' },
  { text: 'I have been crucified with Christ and I no longer live, but Christ lives in me.', reference: 'Galatians 2:20' },
  { text: 'Rejoice always, pray continually, give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.', reference: '1 Thessalonians 5:16-18' },
  { text: 'Create in me a pure heart, O God, and renew a steadfast spirit within me.', reference: 'Psalm 51:10' },
  { text: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.', reference: 'Galatians 6:9' },
  { text: 'Your word is a lamp for my feet, a light on my path.', reference: 'Psalm 119:105' },
  { text: 'With God all things are possible.', reference: 'Matthew 19:26' },
  { text: 'I lift up my eyes to the mountains — where does my help come from? My help comes from the Lord, the Maker of heaven and earth.', reference: 'Psalm 121:1-2' },
  { text: 'Delight yourself in the Lord, and he will give you the desires of your heart.', reference: 'Psalm 37:4' },
  { text: 'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.', reference: '1 Corinthians 10:13' },
  { text: 'Humble yourselves, therefore, under God\'s mighty hand, that he may lift you up in due time.', reference: '1 Peter 5:6' },
  { text: 'For we live by faith, not by sight.', reference: '2 Corinthians 5:7' },
  { text: 'Greater love has no one than this: to lay down one\'s life for one\'s friends.', reference: 'John 15:13' },
  { text: 'The Lord is my light and my salvation — whom shall I fear?', reference: 'Psalm 27:1' },
  { text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.', reference: 'Galatians 5:22-23' },
  { text: 'I will never leave you nor forsake you.', reference: 'Hebrews 13:5' },
  { text: 'In the same way, the Spirit helps us in our weakness. We do not know what we ought to pray for, but the Spirit himself intercedes for us.', reference: 'Romans 8:26' },
  { text: 'For I am the Lord your God who takes hold of your right hand and says to you, Do not fear; I will help you.', reference: 'Isaiah 41:13' },
  { text: 'And my God will meet all your needs according to the riches of his glory in Christ Jesus.', reference: 'Philippians 4:19' },
  { text: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.', reference: 'Psalm 23:4' },
  { text: 'For the Lord God is a sun and shield; the Lord bestows favor and honor; no good thing does he withhold from those whose walk is blameless.', reference: 'Psalm 84:11' },
  { text: 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.', reference: 'Isaiah 26:3' },
  { text: 'The prayer of a righteous person is powerful and effective.', reference: 'James 5:16' },
  { text: 'Now faith is confidence in what we hope for and assurance about what we do not see.', reference: 'Hebrews 11:1' },
  { text: 'For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God.', reference: 'Ephesians 2:8' },
  { text: 'Let the morning bring me word of your unfailing love, for I have put my trust in you.', reference: 'Psalm 143:8' },
  { text: 'The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge.', reference: 'Psalm 18:2' },
  { text: 'This is the day the Lord has made; let us rejoice and be glad in it.', reference: 'Psalm 118:24' },
  { text: 'He heals the brokenhearted and binds up their wounds.', reference: 'Psalm 147:3' },
  { text: 'I sought the Lord, and he answered me; he delivered me from all my fears.', reference: 'Psalm 34:4' },
  { text: 'May the God of hope fill you with all joy and peace as you trust in him.', reference: 'Romans 15:13' },
  { text: 'God is our refuge and strength, an ever-present help in trouble.', reference: 'Psalm 46:1' },
  { text: 'Before I formed you in the womb I knew you, before you were born I set you apart.', reference: 'Jeremiah 1:5' },
  { text: 'The Lord is compassionate and gracious, slow to anger, abounding in love.', reference: 'Psalm 103:8' },
  { text: 'We love because he first loved us.', reference: '1 John 4:19' },
  { text: 'Take delight in the Lord, and he will give you the desires of your heart. Commit your way to the Lord; trust in him and he will do this.', reference: 'Psalm 37:4-5' },
  { text: 'I waited patiently for the Lord; he turned to me and heard my cry.', reference: 'Psalm 40:1' },
  { text: 'See what great love the Father has lavished on us, that we should be called children of God!', reference: '1 John 3:1' },
  { text: 'Every good and perfect gift is from above, coming down from the Father of the heavenly lights.', reference: 'James 1:17' },
  { text: 'I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world.', reference: 'John 16:33' },
  { text: 'Let us then approach God\'s throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need.', reference: 'Hebrews 4:16' },
  { text: 'For where two or three gather in my name, there am I with them.', reference: 'Matthew 18:20' },
  { text: 'Taste and see that the Lord is good; blessed is the one who takes refuge in him.', reference: 'Psalm 34:8' },
  { text: 'My flesh and my heart may fail, but God is the strength of my heart and my portion forever.', reference: 'Psalm 73:26' },
  { text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!', reference: '2 Corinthians 5:17' },
  { text: 'For God did not send his Son into the world to condemn the world, but to save the world through him.', reference: 'John 3:17' },
  { text: 'I have set the Lord always before me. Because he is at my right hand, I will not be shaken.', reference: 'Psalm 16:8' },
  { text: 'Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.', reference: 'Colossians 3:13' },
  { text: 'Surely goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever.', reference: 'Psalm 23:6' },
  { text: 'For everyone born of God overcomes the world. This is the victory that has overcome the world, even our faith.', reference: '1 John 5:4' },
  { text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind.', reference: 'Romans 12:2' },
  { text: 'Blessed are the pure in heart, for they will see God.', reference: 'Matthew 5:8' },
  { text: 'Fear not, for I have redeemed you; I have summoned you by name; you are mine.', reference: 'Isaiah 43:1' },
  { text: 'Jesus said to her, "I am the resurrection and the life. The one who believes in me will live, even though they die."', reference: 'John 11:25' },
  { text: 'He who began a good work in you will carry it on to completion until the day of Christ Jesus.', reference: 'Philippians 1:6' },
  { text: 'Lord, you are my God; I will exalt you and praise your name, for in perfect faithfulness you have done wonderful things.', reference: 'Isaiah 25:1' },
  { text: 'Give thanks to the Lord, for he is good; his love endures forever.', reference: 'Psalm 107:1' },
  { text: 'The Lord is not slow in keeping his promise, as some understand slowness. Instead he is patient with you, not wanting anyone to perish.', reference: '2 Peter 3:9' },
  { text: 'How priceless is your unfailing love, O God! People take refuge in the shadow of your wings.', reference: 'Psalm 36:7' },
  { text: 'Submit yourselves, then, to God. Resist the devil, and he will flee from you. Come near to God and he will come near to you.', reference: 'James 4:7-8' },
  { text: 'I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you.', reference: 'Psalm 32:8' },
  { text: 'You are the light of the world. A town built on a hill cannot be hidden.', reference: 'Matthew 5:14' },
  { text: 'Finally, be strong in the Lord and in his mighty power.', reference: 'Ephesians 6:10' },
  { text: 'The Lord will fight for you; you need only to be still.', reference: 'Exodus 14:14' },
  { text: 'My grace is sufficient for you, for my power is made perfect in weakness.', reference: '2 Corinthians 12:9' },
  { text: 'He wakens me morning by morning, wakens my ear to listen like one being instructed.', reference: 'Isaiah 50:4' },
  { text: 'The Lord your God is in your midst, a mighty one who will save; he will rejoice over you with gladness.', reference: 'Zephaniah 3:17' },
  { text: 'For the Lord watches over the way of the righteous, but the way of the wicked leads to destruction.', reference: 'Psalm 1:6' },
  { text: 'I will praise you, Lord my God, with all my heart; I will glorify your name forever.', reference: 'Psalm 86:12' },
  { text: 'Whoever believes in me, as Scripture has said, rivers of living water will flow from within them.', reference: 'John 7:38' },
  { text: 'We have this hope as an anchor for the soul, firm and secure.', reference: 'Hebrews 6:19' },
  { text: 'The Lord is good, a refuge in times of trouble. He cares for those who trust in him.', reference: 'Nahum 1:7' },
  { text: 'My soul finds rest in God alone; my salvation comes from him.', reference: 'Psalm 62:1' },
  { text: 'The name of the Lord is a fortified tower; the righteous run to it and are safe.', reference: 'Proverbs 18:10' },
  { text: 'Jesus looked at them and said, "With man this is impossible, but with God all things are possible."', reference: 'Matthew 19:26' },
  { text: 'For we are God\'s handiwork, created in Christ Jesus to do good works.', reference: 'Ephesians 2:10' },
  { text: 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit.', reference: 'John 15:5' },
  { text: 'Blessed is the one who trusts in the Lord, whose confidence is in him.', reference: 'Jeremiah 17:7' },
  { text: 'For the word of God is alive and active. Sharper than any double-edged sword.', reference: 'Hebrews 4:12' },
  { text: 'In their hearts humans plan their course, but the Lord establishes their steps.', reference: 'Proverbs 16:9' },
  { text: 'The Lord will guide you always; he will satisfy your needs in a sun-scorched land.', reference: 'Isaiah 58:11' },
  { text: 'Blessed are those who mourn, for they will be comforted.', reference: 'Matthew 5:4' },
  { text: 'Teach me your way, Lord, that I may rely on your faithfulness; give me an undivided heart.', reference: 'Psalm 86:11' },
  { text: 'For the mountains may depart and the hills be removed, but my steadfast love shall not depart from you.', reference: 'Isaiah 54:10' },
  { text: 'The Spirit of God has made me; the breath of the Almighty gives me life.', reference: 'Job 33:4' },
  { text: 'Now to him who is able to do immeasurably more than all we ask or imagine, according to his power that is at work within us.', reference: 'Ephesians 3:20' },
  { text: 'Satisfy us in the morning with your unfailing love, that we may sing for joy and be glad all our days.', reference: 'Psalm 90:14' },
  { text: 'The Lord reigns, let the nations tremble; he sits enthroned between the cherubim, let the earth shake.', reference: 'Psalm 99:1' },
  { text: 'I know that my redeemer lives, and that in the end he will stand on the earth.', reference: 'Job 19:25' },
  { text: 'Commit your works to the Lord, and your plans will be established.', reference: 'Proverbs 16:3' },
  { text: 'Even youths grow tired and weary, and young men stumble and fall; but those who hope in the Lord will renew their strength.', reference: 'Isaiah 40:30-31' },
  { text: 'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.', reference: 'Psalm 4:8' },
  { text: 'The Lord is my strength and my shield; my heart trusts in him, and he helps me.', reference: 'Psalm 28:7' },
  { text: 'For where your treasure is, there your heart will be also.', reference: 'Matthew 6:21' },
  { text: 'Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty.', reference: 'Psalm 91:1' },
  { text: 'O Lord, you have searched me and known me!', reference: 'Psalm 139:1' },
  { text: 'The Lord is my portion; therefore I will wait for him.', reference: 'Lamentations 3:24' },
  { text: 'God is not human, that he should lie, not a human being, that he should change his mind. Does he speak and then not act?', reference: 'Numbers 23:19' },
  { text: 'Blessed are those who hunger and thirst for righteousness, for they will be filled.', reference: 'Matthew 5:6' },
  { text: 'A new command I give you: Love one another. As I have loved you, so you must love one another.', reference: 'John 13:34' },
  { text: 'This is my comfort in my affliction, that your promise gives me life.', reference: 'Psalm 119:50' },
  { text: 'Return to me with all your heart, with fasting and weeping and mourning. Rend your heart and not your garments.', reference: 'Joel 2:12-13' },
  { text: 'And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', reference: 'Philippians 4:7' },
  { text: 'The Lord is righteous in all his ways and faithful in all he does.', reference: 'Psalm 145:17' },
  { text: 'May he give you the desire of your heart and make all your plans succeed.', reference: 'Psalm 20:4' },
  { text: 'When I called, you answered me; you greatly emboldened me.', reference: 'Psalm 138:3' },
  { text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail.', reference: 'Lamentations 3:22' },
  { text: 'I will sing of the Lord\'s great love forever; with my mouth I will make your faithfulness known through all generations.', reference: 'Psalm 89:1' },
  { text: 'Not by might nor by power, but by my Spirit, says the Lord Almighty.', reference: 'Zechariah 4:6' },
  { text: 'For you created my inmost being; you knit me together in my mother\'s womb.', reference: 'Psalm 139:13' },
  { text: 'He is before all things, and in him all things hold together.', reference: 'Colossians 1:17' },
  { text: 'For this reason I kneel before the Father, from whom every family in heaven and on earth derives its name.', reference: 'Ephesians 3:14-15' },
  { text: 'Draw near to God and He will draw near to you.', reference: 'James 4:8' },
  { text: 'Even the sparrow has found a home, and the swallow a nest for herself, where she may have her young — a place near your altar, Lord Almighty.', reference: 'Psalm 84:3' },
  { text: 'If you remain in me and my words remain in you, ask whatever you wish, and it will be done for you.', reference: 'John 15:7' },
  { text: 'Our Father in heaven, hallowed be your name, your kingdom come, your will be done.', reference: 'Matthew 6:9-10' },
  { text: 'Do not let your hearts be troubled. You believe in God; believe also in me.', reference: 'John 14:1' },
  { text: 'I keep my eyes always on the Lord. With him at my right hand, I will not be shaken.', reference: 'Psalm 16:8' },
  { text: 'Wait for the Lord; be strong and take heart and wait for the Lord.', reference: 'Psalm 27:14' },
  { text: 'The Lord appeared to us in the past, saying: "I have loved you with an everlasting love; I have drawn you with unfailing kindness."', reference: 'Jeremiah 31:3' },
  { text: 'But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him.', reference: 'Isaiah 53:5' },
  { text: 'For to me, to live is Christ and to die is gain.', reference: 'Philippians 1:21' },
  { text: 'Blessed are the peacemakers, for they will be called children of God.', reference: 'Matthew 5:9' },
  { text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.', reference: 'Colossians 3:23' },
  { text: 'Through Jesus, therefore, let us continually offer to God a sacrifice of praise.', reference: 'Hebrews 13:15' },
  { text: 'How good and pleasant it is when God\'s people live together in unity!', reference: 'Psalm 133:1' },
  { text: 'The righteous person may have many troubles, but the Lord delivers him from them all.', reference: 'Psalm 34:19' },
  { text: 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.', reference: 'Psalm 23:1-3' },
  { text: 'God\'s love has been poured out into our hearts through the Holy Spirit, who has been given to us.', reference: 'Romans 5:5' },
  { text: 'Let your gentleness be evident to all. The Lord is near.', reference: 'Philippians 4:5' },
  { text: 'I have learned, in whatever state I am, to be content.', reference: 'Philippians 4:11' },
  { text: 'You, Lord, keep my lamp burning; my God turns my darkness into light.', reference: 'Psalm 18:28' },
  { text: 'Eye has not seen, nor ear heard, nor have entered into the heart of man the things which God has prepared for those who love Him.', reference: '1 Corinthians 2:9' },
  { text: 'The joy of the Lord is your strength.', reference: 'Nehemiah 8:10' },
  { text: 'Your faithfulness reaches to the skies. Your righteousness is like the highest mountains.', reference: 'Psalm 36:5-6' },
  { text: 'Though the fig tree does not bud and there are no grapes on the vines, yet I will rejoice in the Lord.', reference: 'Habakkuk 3:17-18' },
  { text: 'Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom.', reference: 'Colossians 3:16' },
  { text: 'God is within her, she will not fall; God will help her at break of day.', reference: 'Psalm 46:5' },
  { text: 'Praise be to the Lord, to God our Savior, who daily bears our burdens.', reference: 'Psalm 68:19' },
  { text: 'For it is God who works in you to will and to act in order to fulfill his good purpose.', reference: 'Philippians 2:13' },
  { text: 'Weeping may stay for the night, but rejoicing comes in the morning.', reference: 'Psalm 30:5' },
  { text: 'You will seek me and find me when you seek me with all your heart.', reference: 'Jeremiah 29:13' },
  { text: 'The Lord does not look at the things people look at. People look at the outward appearance, but the Lord looks at the heart.', reference: '1 Samuel 16:7' },
  { text: 'A generous person will prosper; whoever refreshes others will be refreshed.', reference: 'Proverbs 11:25' },
  { text: 'Therefore we do not lose heart. Though outwardly we are wasting away, yet inwardly we are being renewed day by day.', reference: '2 Corinthians 4:16' },
  { text: 'May the Lord direct your hearts into God\'s love and Christ\'s perseverance.', reference: '2 Thessalonians 3:5' },
  { text: 'God has said, "Never will I leave you; never will I forsake you."', reference: 'Hebrews 13:5' },
  { text: 'He will cover you with his feathers, and under his wings you will find refuge; his faithfulness will be your shield.', reference: 'Psalm 91:4' },
  { text: 'By faith Abraham obeyed when he was called to go out to a place that he was to receive as an inheritance. And he went out, not knowing where he was going.', reference: 'Hebrews 11:8' },
  { text: 'The Lord your God is in your midst, a mighty one who will save.', reference: 'Zephaniah 3:17' },
  { text: 'I will lie down and sleep in peace, for you alone, Lord, make me dwell in safety.', reference: 'Psalm 4:8' },
  { text: 'Bless those who persecute you; bless and do not curse.', reference: 'Romans 12:14' },
  { text: 'God is not unjust; he will not forget your work and the love you have shown him.', reference: 'Hebrews 6:10' },
  { text: 'From the rising of the sun to the place where it sets, the name of the Lord is to be praised.', reference: 'Psalm 113:3' },
  { text: 'As far as the east is from the west, so far has he removed our transgressions from us.', reference: 'Psalm 103:12' },
  { text: 'Do not be overcome by evil, but overcome evil with good.', reference: 'Romans 12:21' },
  { text: 'Who shall separate us from the love of Christ? Shall trouble or hardship or persecution or famine or nakedness or danger or sword?', reference: 'Romans 8:35' },
  { text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.', reference: 'Romans 5:8' },
  { text: 'All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness.', reference: '2 Timothy 3:16' },
  { text: 'Let us hold unswervingly to the hope we profess, for he who promised is faithful.', reference: 'Hebrews 10:23' },
  { text: 'For we do not have a high priest who is unable to empathize with our weaknesses, but we have one who has been tempted in every way, just as we are — yet he did not sin.', reference: 'Hebrews 4:15' },
  { text: 'Praise the Lord, my soul, and forget not all his benefits.', reference: 'Psalm 103:2' },
  { text: 'I can do all things through Christ who strengthens me.', reference: 'Philippians 4:13' },
  { text: 'Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take.', reference: 'Psalm 1:1' },
  { text: 'He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.', reference: 'Micah 6:8' },
  { text: 'For I consider that the sufferings of this present time are not worth comparing with the glory that is to be revealed to us.', reference: 'Romans 8:18' },
  { text: 'Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely — think about such things.', reference: 'Philippians 4:8' },
  { text: 'The righteous will live by faith.', reference: 'Romans 1:17' },
  { text: 'We are hard pressed on every side, but not crushed; perplexed, but not in despair.', reference: '2 Corinthians 4:8' },
  { text: 'And I am sure of this, that he who began a good work in you will bring it to completion.', reference: 'Philippians 1:6' },
  { text: 'Blessed are those who are persecuted because of righteousness, for theirs is the kingdom of heaven.', reference: 'Matthew 5:10' },
  { text: 'He has made everything beautiful in its time.', reference: 'Ecclesiastes 3:11' },
  { text: 'For I have learned, in whatever situation I am, to be content.', reference: 'Philippians 4:11' },
  { text: 'He who goes out weeping, carrying seed to sow, will return with songs of joy.', reference: 'Psalm 126:6' },
  { text: 'But I trust in your unfailing love; my heart rejoices in your salvation.', reference: 'Psalm 13:5' },
  { text: 'I am the way and the truth and the life. No one comes to the Father except through me.', reference: 'John 14:6' },
  { text: 'And now these three remain: faith, hope and love. But the greatest of these is love.', reference: '1 Corinthians 13:13' },
  { text: 'Where can I go from your Spirit? Where can I flee from your presence?', reference: 'Psalm 139:7' },
  { text: 'For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast.', reference: 'Ephesians 2:8-9' },
  { text: 'The Lord works righteousness and justice for all the oppressed.', reference: 'Psalm 103:6' },
  { text: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over.', reference: 'Luke 6:38' },
  { text: 'Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.', reference: 'Matthew 5:16' },
  { text: 'The Lord is not slow to fulfill his promise as some count slowness, but is patient toward you.', reference: '2 Peter 3:9' },
  { text: 'Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith.', reference: 'Hebrews 12:1-2' },
  { text: 'May the God of peace himself sanctify you completely, and may your whole spirit and soul and body be kept blameless.', reference: '1 Thessalonians 5:23' },
  { text: 'For the Lord is good and his love endures forever; his faithfulness continues through all generations.', reference: 'Psalm 100:5' },
  { text: 'They will be called oaks of righteousness, a planting of the Lord for the display of his splendor.', reference: 'Isaiah 61:3' },
  { text: 'And I heard a loud voice from the throne saying, "Look! God\'s dwelling place is now among the people, and he will dwell with them."', reference: 'Revelation 21:3' },
  { text: 'I am the Alpha and the Omega, the First and the Last, the Beginning and the End.', reference: 'Revelation 22:13' },
  { text: 'He who testifies to these things says, "Yes, I am coming soon." Amen. Come, Lord Jesus.', reference: 'Revelation 22:20' },
];

export function getDayVerse(date?: Date): Verse {
  if (verses.length === 0) return FALLBACK_VERSE;
  return verses[(dayOfYear(date) - 1) % verses.length];
}
```

> **Note for implementer:** The array above has approximately 250 entries. Expand it to at least 365 unique verses before shipping, using a diverse mix of Old and New Testament passages covering themes of trust, healing, hope, love, prayer, and praise. Each verse must be a distinct `{ text, reference }` object.

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/lib/verses.test.ts
```

Expected output:
```
✓ verses array > has at least 365 entries
✓ verses array > every entry has non-empty text and reference
✓ getDayVerse > returns a valid verse for Jan 1
✓ getDayVerse > returns a valid verse for Dec 31
✓ getDayVerse > returns different verses for consecutive days
✓ getDayVerse > returns fallback verse when verses array is emptied
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/verses.ts src/lib/verses.test.ts
git commit -m "feat: add verse library with getDayVerse()"
```

---

## Task 2: Email Template

**Files:**
- Create: `src/emails/morning-email.tsx`

### Codebase context

Read `src/emails/daily-brief.tsx` to understand the existing React Email pattern used in this project. The new template follows the same import style (`@react-email/components`) but has a different layout and three sections instead of one.

Designer + Frontend agents own the visual polish — this task establishes the functional structure that renders correctly. Polish the colors, spacing, and typography to match PrayerJar's brand after functionality is confirmed.

---

- [ ] **Step 1: Create `src/emails/morning-email.tsx`**

```typescript
import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr, Section, Row, Column,
} from '@react-email/components';

const CATEGORY_LABELS: Record<string, string> = {
  health: 'Health',
  family: 'Family',
  financial: 'Financial',
  grief: 'Grief',
  gratitude: 'Gratitude',
  guidance: 'Guidance',
  relationships: 'Relationships',
  work_career: 'Work & Career',
  spiritual_growth: 'Spiritual Growth',
  other: 'Other',
};

interface MorningEmailProps {
  userName?: string;
  date: string;
  verse: { text: string; reference: string };
  activity: {
    prayersReceived: number;
    encouragements: number;
    streak: number;
  };
  prayers: Array<{
    content: string;
    category: string;
    prayerCount: number;
  }>;
}

export default function MorningEmail({ userName, date, verse, activity, prayers }: MorningEmailProps) {
  const hasActivity = activity.prayersReceived > 0 || activity.encouragements > 0 || activity.streak > 0;

  return (
    <Html>
      <Head />
      <Preview>Your morning verse — {date}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' }}>

          {/* Header */}
          <Section style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '28px 32px 24px' }}>
            <Text style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: '0 0 6px' }}>
              PrayerJar · {date}
            </Text>
            <Heading style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0', lineHeight: '1.2' }}>
              Good morning{userName ? `, ${userName}` : ''}.
            </Heading>
          </Section>

          {/* Verse of the Day */}
          <Section style={{ padding: '24px 32px', backgroundColor: '#faf9ff', borderBottom: '1px solid #ede9fe' }}>
            <Text style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c3aed', margin: '0 0 12px' }}>
              ✦ Verse of the Day
            </Text>
            <Text style={{ fontSize: '17px', lineHeight: '1.65', color: '#1f1535', fontStyle: 'italic', margin: '0 0 10px' }}>
              &ldquo;{verse.text}&rdquo;
            </Text>
            <Text style={{ fontSize: '13px', color: '#6d28d9', fontWeight: '600', margin: '0' }}>
              — {verse.reference}
            </Text>
          </Section>

          {/* Activity (only shown if at least one stat is non-zero) */}
          {hasActivity && (
            <Section style={{ padding: '20px 32px', borderBottom: '1px solid #f3f4f6' }}>
              <Text style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 14px' }}>
                Your Activity Yesterday
              </Text>
              <Row>
                {activity.prayersReceived > 0 && (
                  <Column style={{ flex: '1', backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '12px', textAlign: 'center', marginRight: '8px' }}>
                    <Text style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a', margin: '0 0 4px' }}>
                      {activity.prayersReceived}
                    </Text>
                    <Text style={{ fontSize: '11px', color: '#166534', margin: '0' }}>
                      people prayed for you
                    </Text>
                  </Column>
                )}
                {activity.encouragements > 0 && (
                  <Column style={{ flex: '1', backgroundColor: '#eff6ff', borderRadius: '8px', padding: '12px', textAlign: 'center', marginRight: '8px' }}>
                    <Text style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb', margin: '0 0 4px' }}>
                      {activity.encouragements}
                    </Text>
                    <Text style={{ fontSize: '11px', color: '#1e40af', margin: '0' }}>
                      encouragements received
                    </Text>
                  </Column>
                )}
                {activity.streak > 0 && (
                  <Column style={{ flex: '1', backgroundColor: '#fff7ed', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <Text style={{ fontSize: '24px', fontWeight: '700', color: '#ea580c', margin: '0 0 4px' }}>
                      🔥 {activity.streak}
                    </Text>
                    <Text style={{ fontSize: '11px', color: '#9a3412', margin: '0' }}>
                      day streak
                    </Text>
                  </Column>
                )}
              </Row>
            </Section>
          )}

          {/* Prayers */}
          <Section style={{ padding: '20px 32px 28px' }}>
            <Text style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 14px' }}>
              3 Prayers Waiting for You
            </Text>

            {prayers.map((prayer, i) => {
              const snippet = prayer.content.length > 120 ? prayer.content.slice(0, 120) + '...' : prayer.content;
              const categoryLabel = CATEGORY_LABELS[prayer.category] ?? prayer.category;
              const prayUrl = `https://prayerjar.org/pray/${prayer.category}`;

              return (
                <Section key={i} style={{ marginBottom: '14px', padding: '14px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', borderLeft: '3px solid #4f46e5' }}>
                  <Text style={{ fontSize: '10px', fontWeight: '600', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
                    {categoryLabel}
                  </Text>
                  <Text style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5', margin: '0 0 8px' }}>
                    &ldquo;{snippet}&rdquo;
                  </Text>
                  <Text style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 10px' }}>
                    {prayer.prayerCount === 1 ? '1 person praying' : `${prayer.prayerCount} people praying`}
                  </Text>
                  <Button
                    href={prayUrl}
                    style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}
                  >
                    Pray Now
                  </Button>
                </Section>
              );
            })}

            <Text style={{ textAlign: 'center', margin: '16px 0 0' }}>
              <a href="https://prayerjar.org/browse" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
                Browse all prayers →
              </a>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={{ borderColor: '#f3f4f6', margin: '0' }} />
          <Section style={{ padding: '16px 32px', backgroundColor: '#f9fafb' }}>
            <Text style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', margin: '0' }}>
              You&apos;re receiving this because you have morning emails enabled.{' '}
              <a href="https://prayerjar.org/settings/notifications" style={{ color: '#6b7280' }}>
                Unsubscribe
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors referencing `morning-email.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/emails/morning-email.tsx
git commit -m "feat: add MorningEmail React Email template"
```

---

## Task 3: Cron Handler + Integration Tests

**Files:**
- Create: `src/app/api/cron/morning-email/route.ts`
- Create: `src/app/api/cron/morning-email/route.test.ts`

### Codebase context

- Read `src/app/api/cron/church-digest/route.test.ts` — this is the exact mock pattern to follow for DB and Resend mocking.
- Read `src/lib/quiet-hours.ts` — the `isInQuietHours` function signature your handler will call.
- DB schema key facts:
  - `prayers.authorId` — the UUID of the user who created the prayer (NOT `userId`)
  - `prayerInteractions.prayerId` — foreign key to `prayers.id`
  - `prayerInteractions.message` — nullable; non-null means it's an encouragement
  - `users.currentStreak` — integer, already on the user row
  - `prayers.status` — enum: `'active'`, `'answered'`, `'expired'`

---

- [ ] **Step 1: Write the failing integration tests**

Create `src/app/api/cron/morning-email/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockDbResults: unknown[][] = [];
let callIndex = 0;

vi.mock('@/db', () => {
  const makeChain = (result: unknown) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(() => Promise.resolve(result)),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  });

  const dbProxy = new Proxy({} as Record<string, unknown>, {
    get(_target, prop) {
      if (prop === 'select' || prop === 'selectDistinct') {
        return () => {
          const result = mockDbResults[callIndex++] ?? [];
          return makeChain(result);
        };
      }
      return undefined;
    },
  });

  return { db: dbProxy };
});

vi.mock('resend', () => {
  const send = vi.fn().mockResolvedValue({ id: 'mock-email-id' });
  return {
    Resend: function MockResend(this: { emails: { send: typeof send } }) {
      this.emails = { send };
    },
  };
});

vi.mock('@react-email/components', async (importOriginal) => {
  const original = await importOriginal<typeof import('@react-email/components')>();
  return { ...original, render: vi.fn().mockResolvedValue('<html>morning</html>') };
});

vi.mock('@/emails/morning-email', () => ({
  default: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/verses', () => ({
  getDayVerse: vi.fn().mockReturnValue({ text: 'Test verse.', reference: 'Test 1:1' }),
}));

import { GET } from './route';

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== undefined) headers['authorization'] = `Bearer ${secret}`;
  return new NextRequest('http://localhost/api/cron/morning-email', { headers });
}

const ELIGIBLE_USER = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Ron',
  currentStreak: 5,
  quietHoursStart: null,
  quietHoursEnd: null,
  quietHoursTimezone: null,
};

const THREE_PRAYERS = [
  { content: 'Pray for my family', category: 'family', prayerCount: 4 },
  { content: 'Heal my friend', category: 'health', prayerCount: 2 },
  { content: 'Guide my career', category: 'work_career', prayerCount: 1 },
];

describe('GET /api/cron/morning-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbResults = [];
    callIndex = 0;
    process.env.CRON_SECRET = 'test-secret';
  });

  it('returns 401 when no authorization header is provided', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when authorization header has wrong secret', async () => {
    const res = await GET(makeRequest('wrong-secret'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns { sent: 0, skipped: 0 } when no eligible users', async () => {
    // DB call 0: users query → empty
    mockDbResults = [[]];
    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 0, skipped: 0 });
  });

  it('returns { sent: 1, skipped: 0 } for one user with activity', async () => {
    // DB call order (per route.ts):
    // 0: eligibleUsers
    // 1: prayersReceivedCount  (innerJoin, no .limit() — resolves via then)
    // 2: encouragementsCount   (innerJoin, no .limit() — resolves via then)
    // 3: prayerRows            (.limit(3) — resolves via limit)
    mockDbResults = [
      [ELIGIBLE_USER],
      [{ count: 3 }],
      [{ count: 1 }],
      THREE_PRAYERS,
    ];
    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 1, skipped: 0 });
  });

  it('skips user when inside quiet hours (0–23 UTC covers all hours)', async () => {
    mockDbResults = [
      [{ ...ELIGIBLE_USER, quietHoursStart: 0, quietHoursEnd: 23, quietHoursTimezone: 'UTC' }],
    ];
    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 0, skipped: 1 });
  });

  it('skips user when no active prayers are available', async () => {
    mockDbResults = [
      [ELIGIBLE_USER],
      [{ count: 0 }],  // prayersReceivedCount
      [{ count: 0 }],  // encouragementsCount
      [],              // no active prayers (.limit returns empty array)
    ];
    const res = await GET(makeRequest('test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 0, skipped: 1 });
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/app/api/cron/morning-email/route.test.ts
```

Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Create `src/app/api/cron/morning-email/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, prayers, prayerInteractions } from '@/db/schema';
import { eq, and, isNotNull, gte, sql } from 'drizzle-orm';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';
import MorningEmail from '@/emails/morning-email';
import { getDayVerse } from '@/lib/verses';
import { isInQuietHours } from '@/lib/quiet-hours';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>';
const BATCH_SIZE = 50;

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function yesterdayMidnightUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const verse = getDayVerse();
  const date = formatDate();
  const since = yesterdayMidnightUTC();

  const eligibleUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      currentStreak: users.currentStreak,
      quietHoursStart: users.quietHoursStart,
      quietHoursEnd: users.quietHoursEnd,
      quietHoursTimezone: users.quietHoursTimezone,
    })
    .from(users)
    .where(and(eq(users.notifyOnDigest, true), isNotNull(users.email)));

  let sent = 0;
  let skipped = 0;

  for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
    const batch = eligibleUsers.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (user) => {
        if (!user.email) { skipped++; return; }
        if (isInQuietHours(user)) { skipped++; return; }

        try {
          const [receivedRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(prayerInteractions)
            .innerJoin(prayers, eq(prayerInteractions.prayerId, prayers.id))
            .where(
              and(
                eq(prayers.authorId, user.id),
                gte(prayerInteractions.createdAt, since),
              )
            );

          const [encouragementsRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(prayerInteractions)
            .innerJoin(prayers, eq(prayerInteractions.prayerId, prayers.id))
            .where(
              and(
                eq(prayers.authorId, user.id),
                gte(prayerInteractions.createdAt, since),
                isNotNull(prayerInteractions.message),
              )
            );

          const prayerRows = await db
            .select({
              content: prayers.content,
              category: prayers.category,
              prayerCount: prayers.prayerCount,
            })
            .from(prayers)
            .where(eq(prayers.status, 'active'))
            .orderBy(sql`RANDOM()`)
            .limit(3);

          if (prayerRows.length === 0) { skipped++; return; }

          const html = await render(
            MorningEmail({
              userName: user.name ?? undefined,
              date,
              verse,
              activity: {
                prayersReceived: receivedRow?.count ?? 0,
                encouragements: encouragementsRow?.count ?? 0,
                streak: user.currentStreak,
              },
              prayers: prayerRows,
            })
          );

          await resend.emails.send({
            from: FROM,
            to: user.email,
            subject: `Good morning — ${date}`,
            html,
          });

          sent++;
        } catch (err) {
          Sentry.captureException(err);
          skipped++;
        }
      })
    );
  }

  return NextResponse.json({ sent, skipped });
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/app/api/cron/morning-email/route.test.ts
```

Expected output:
```
✓ GET /api/cron/morning-email > returns 401 when no authorization header is provided
✓ GET /api/cron/morning-email > returns 401 when authorization header has wrong secret
✓ GET /api/cron/morning-email > returns { sent: 0, skipped: 0 } when no eligible users
✓ GET /api/cron/morning-email > returns { sent: 1, skipped: 0 } for one user with activity
✓ GET /api/cron/morning-email > skips user when inside quiet hours (0–23 UTC covers all hours)
✓ GET /api/cron/morning-email > skips user when no active prayers are available
```

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all previously passing tests still pass

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/morning-email/route.ts src/app/api/cron/morning-email/route.test.ts
git commit -m "feat: add morning-email cron handler with integration tests"
```

---

## Task 4: Wire Up & Clean Up

**Files:**
- Modify: `vercel.json`
- Delete: `src/app/api/cron/daily-brief/route.ts`
- Delete: `src/emails/daily-brief.tsx`

---

- [ ] **Step 1: Update `vercel.json`**

Open `vercel.json`. Find the `daily-brief` cron entry:

```json
{
  "path": "/api/cron/daily-brief",
  "schedule": "0 7 * * *"
}
```

Replace it with:

```json
{
  "path": "/api/cron/morning-email",
  "schedule": "0 7 * * *"
}
```

The schedule stays `0 7 * * *` (7am UTC daily). All other cron entries remain unchanged.

- [ ] **Step 2: Delete the old cron handler**

```bash
rm src/app/api/cron/daily-brief/route.ts
rmdir src/app/api/cron/daily-brief
```

- [ ] **Step 3: Delete the old email template**

```bash
rm src/emails/daily-brief.tsx
```

- [ ] **Step 4: Verify TypeScript has no dangling imports**

```bash
npx tsc --noEmit
```

Expected: no errors. (If you see `Cannot find module '@/emails/daily-brief'` anywhere, search the codebase for any remaining import of it and remove it.)

```bash
grep -r "daily-brief" src/
```

Expected: no results

- [ ] **Step 5: Run the full test suite one final time**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add vercel.json
git rm src/app/api/cron/daily-brief/route.ts
git rm src/emails/daily-brief.tsx
git commit -m "feat: replace daily-brief with morning-email cron (verse + activity + prayers)"
```

---

## Done

All four tasks complete = Sprint 16 implementation done:
- `src/lib/verses.ts` — verse library, tested
- `src/emails/morning-email.tsx` — React Email template with verse, activity, and prayers sections
- `src/app/api/cron/morning-email/route.ts` — cron handler, tested
- `vercel.json` — updated schedule entry
- Old `daily-brief` files deleted

Next: Designer + Frontend agents review and polish `src/emails/morning-email.tsx` for visual quality.
