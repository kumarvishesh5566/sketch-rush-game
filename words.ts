export const WORDS_DATABASE: Record<string, string[]> = {
  animals: [
    'cat', 'dog', 'elephant', 'giraffe', 'penguin', 'kangaroo', 'dolphin', 'lion',
    'tiger', 'monkey', 'panda', 'octopus', 'rabbit', 'butterfly', 'shark', 'zebra',
    'snake', 'owl', 'crocodile', 'flamingo', 'hedgehog', 'whale', 'peacock', 'camel',
    'squirrel', 'koala', 'bat', 'crab', 'turtle', 'fox', 'parrot', 'snail'
  ],
  food: [
    'pizza', 'burger', 'ice cream', 'banana', 'sushi', 'donut', 'taco', 'pancake',
    'spaghetti', 'apple', 'popcorn', 'sandwich', 'cookie', 'watermelon', 'hot dog',
    'croissant', 'avocado', 'cheese', 'cupcake', 'strawberry', 'chocolate', 'noodles',
    'french fries', 'pineapple', 'lollipop', 'bread', 'cake', 'egg', 'cherry', 'grape'
  ],
  objects: [
    'guitar', 'clock', 'umbrella', 'telescope', 'laptop', 'camera', 'rocket', 'bicycle',
    'microscope', 'compass', 'flashlight', 'scissors', 'backpack', 'anchor', 'balloon',
    'candle', 'key', 'hammer', 'glasses', 'skateboard', 'book', 'bell', 'pencil', 'chair',
    'sword', 'trophy', 'mirror', 'lamp', 'suitcase', 'magnet', 'kite', 'crown'
  ],
  places: [
    'castle', 'beach', 'mountain', 'pyramid', 'lighthouse', 'airport', 'hospital',
    'library', 'volcano', 'island', 'space station', 'circus', 'cave', 'stadium',
    'bridge', 'forest', 'desert', 'amusement park', 'waterfall', 'subway', 'windmill'
  ],
  verbs: [
    'dancing', 'swimming', 'flying', 'sleeping', 'cooking', 'singing', 'painting',
    'running', 'fishing', 'climbing', 'reading', 'skating', 'jumping', 'laughing',
    'driving', 'crying', 'celebrating', 'typing', 'yawning', 'waving'
  ],
};

export function getRandomWordList(category: string = 'mixed', count: number = 3, customWords: string[] = []): string[] {
  let pool: string[] = [];

  if (customWords && customWords.length > 0) {
    pool = [...customWords];
  }

  if (category === 'mixed' || !WORDS_DATABASE[category]) {
    Object.values(WORDS_DATABASE).forEach((list) => {
      pool.push(...list);
    });
  } else {
    pool.push(...(WORDS_DATABASE[category] || []));
  }

  // Shuffle and pick unique words
  const shuffled = [...new Set(pool)].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
