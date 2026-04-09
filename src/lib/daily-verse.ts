export const VERSES = [
  { text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', reference: 'Jeremiah 29:11' },
  { text: 'I can do all things through Christ who strengthens me.', reference: 'Philippians 4:13' },
  { text: 'The Lord is my shepherd; I shall not want.', reference: 'Psalm 23:1' },
  { text: 'Cast all your anxiety on him because he cares for you.', reference: '1 Peter 5:7' },
  { text: 'Be still and know that I am God.', reference: 'Psalm 46:10' },
  { text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', reference: 'Proverbs 3:5-6' },
  { text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', reference: 'Psalm 34:18' },
  { text: 'Come to me, all you who are weary and burdened, and I will give you rest.', reference: 'Matthew 11:28' },
  { text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', reference: 'Philippians 4:6-7' },
  { text: 'He heals the brokenhearted and binds up their wounds.', reference: 'Psalm 147:3' },
  { text: 'The Lord will fight for you; you need only to be still.', reference: 'Exodus 14:14' },
  { text: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me.', reference: 'Psalm 23:4' },
  { text: 'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.', reference: 'Matthew 7:7' },
  { text: 'For nothing will be impossible with God.', reference: 'Luke 1:37' },
  { text: 'God is our refuge and strength, an ever-present help in trouble.', reference: 'Psalm 46:1' },
  { text: 'The prayer of a righteous person is powerful and effective.', reference: 'James 5:16' },
  { text: 'Do not fear, for I am with you; do not be dismayed, for I am your God.', reference: 'Isaiah 41:10' },
  { text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', reference: 'Romans 8:28' },
  { text: 'Let us therefore come boldly to the throne of grace, that we may obtain mercy and find grace to help in time of need.', reference: 'Hebrews 4:16' },
  { text: 'Before they call I will answer; while they are still speaking I will hear.', reference: 'Isaiah 65:24' },
  { text: 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you.', reference: 'Zephaniah 3:17' },
  { text: 'He gives strength to the weary and increases the power of the weak.', reference: 'Isaiah 40:29' },
  { text: 'Delight yourself in the Lord, and he will give you the desires of your heart.', reference: 'Psalm 37:4' },
  { text: 'With God all things are possible.', reference: 'Matthew 19:26' },
  { text: 'For the Lord your God is gracious and compassionate.', reference: '2 Chronicles 30:9' },
  { text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives.', reference: 'John 14:27' },
  { text: 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.', reference: 'Numbers 6:24-26' },
  { text: 'I lift up my eyes to the mountains — where does my help come from? My help comes from the Lord, the Maker of heaven and earth.', reference: 'Psalm 121:1-2' },
  { text: 'Yet those who wait for the Lord will gain new strength; they will mount up with wings like eagles.', reference: 'Isaiah 40:31' },
  { text: 'This is the day the Lord has made; let us rejoice and be glad in it.', reference: 'Psalm 118:24' },
];

export function getDailyVerse(): { text: string; reference: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return VERSES[dayOfYear % VERSES.length];
}
