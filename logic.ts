/**
 * Pure game logic functions for skribbl.io clone
 * Scoring, word matching, hint generation, and distance checking
 */

export interface WordMatchResult {
  isExact: boolean;
  isClose: boolean;
  distance: number;
}

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();

  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s1.length][s2.length];
}

/**
 * Match a player's guess against target word
 * Returns exact match or close match (distance == 1 for words >= 4 chars)
 */
export function checkWordMatch(guess: string, targetWord: string): WordMatchResult {
  const g = guess.trim().toLowerCase();
  const t = targetWord.trim().toLowerCase();

  if (!g || !t) {
    return { isExact: false, isClose: false, distance: 99 };
  }

  if (g === t) {
    return { isExact: true, isClose: false, distance: 0 };
  }

  const dist = levenshteinDistance(g, t);
  const isClose = (t.length >= 4 && dist === 1) || (t.length >= 7 && dist <= 2);

  return {
    isExact: false,
    isClose,
    distance: dist,
  };
}

/**
 * Calculate guess points based on time remaining and guess order
 * Max base points 400, first guesser gets bonus, decays as time runs out
 */
export function calculateGuessPoints(
  timeLeft: number,
  maxTime: number,
  guessOrder: number // 1 for first guesser, 2 for second...
): number {
  if (timeLeft <= 0 || maxTime <= 0) return 50;

  const timeRatio = Math.min(1, Math.max(0, timeLeft / maxTime));
  // Base points 200 - 400 depending on time
  const timePoints = Math.round(200 + timeRatio * 200);

  // Bonus for earlier guessers (order 1 gets +100, order 2 gets +60, order 3 gets +30)
  const orderBonus = Math.max(0, 100 - (guessOrder - 1) * 35);

  return Math.min(500, timePoints + orderBonus);
}

/**
 * Drawer gets points proportional to how many players guessed
 */
export function calculateDrawerPoints(guessCount: number, totalGuessers: number): number {
  if (totalGuessers <= 0 || guessCount <= 0) return 0;
  const ratio = Math.min(1, guessCount / totalGuessers);
  return Math.round(150 + ratio * 200);
}

/**
 * Generate hints: blanks or revealed letters
 * Words like "ice cream" will keep spaces and hyphens intact
 */
export function generateHintDisplay(word: string, revealedIndices: number[]): string {
  // Split words by space first so each word gets underscore representations
  const words = word.split(' ');
  let charGlobalIdx = 0;

  return words
    .map((w) => {
      const renderedChars = w.split('').map((char) => {
        const idx = charGlobalIdx++;
        if (char === '-' || char === '\'') return char;
        if (revealedIndices.includes(idx)) return char;
        return '_';
      });
      // Skip the space index in global count
      charGlobalIdx++;
      return renderedChars.join(' ');
    })
    .join('   ');
}

/**
 * Pick a new index to reveal in the word that is not yet revealed and not whitespace
 */
export function pickNextHintIndex(word: string, revealedIndices: number[]): number | null {
  const eligible: number[] = [];
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    if (char !== ' ' && char !== '-' && !revealedIndices.includes(i)) {
      eligible.push(i);
    }
  }

  if (eligible.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * eligible.length);
  return eligible[randomIndex];
}
