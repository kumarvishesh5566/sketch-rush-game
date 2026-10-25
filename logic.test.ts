import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkWordMatch,
  calculateGuessPoints,
  calculateDrawerPoints,
  generateHintDisplay,
  levenshteinDistance,
  pickNextHintIndex,
} from './logic.js';

test('levenshteinDistance computes accurate edit distance', () => {
  assert.equal(levenshteinDistance('apple', 'apple'), 0);
  assert.equal(levenshteinDistance('apple', 'aple'), 1);
  assert.equal(levenshteinDistance('kitten', 'sitting'), 3);
  assert.equal(levenshteinDistance('DOG', 'dog'), 0); // case insensitive
});

test('checkWordMatch handles exact matches case-insensitively', () => {
  const match = checkWordMatch('ElePHant', 'elephant');
  assert.equal(match.isExact, true);
  assert.equal(match.isClose, false);
});

test('checkWordMatch identifies close guesses', () => {
  const close = checkWordMatch('elefant', 'elephant');
  assert.equal(close.isExact, false);
  // 'elephant' (8 chars) vs 'elefant': dist is 2, length >= 7 -> isClose: true
  assert.equal(close.isClose, true);

  const typo = checkWordMatch('banan', 'banana');
  assert.equal(typo.isExact, false);
  assert.equal(typo.isClose, true);

  const far = checkWordMatch('watermelon', 'banana');
  assert.equal(far.isExact, false);
  assert.equal(far.isClose, false);
});

test('calculateGuessPoints rewards speed and guess order', () => {
  const fastOrder1 = calculateGuessPoints(60, 60, 1);
  const slowOrder1 = calculateGuessPoints(10, 60, 1);
  const fastOrder3 = calculateGuessPoints(60, 60, 3);

  assert.ok(fastOrder1 > slowOrder1, 'Faster guesses should earn more points');
  assert.ok(fastOrder1 > fastOrder3, 'Earlier guess order should earn more points');
  assert.ok(fastOrder1 <= 500, 'Max points cap');
});

test('calculateDrawerPoints scales with proportion of guessers', () => {
  assert.equal(calculateDrawerPoints(0, 4), 0);
  const halfGuessed = calculateDrawerPoints(2, 4);
  const allGuessed = calculateDrawerPoints(4, 4);

  assert.ok(halfGuessed > 0);
  assert.ok(allGuessed > halfGuessed);
});

test('generateHintDisplay formats blanks and revealed letters correctly', () => {
  const word = 'ice cream';
  const initial = generateHintDisplay(word, []);
  // 'i c e' (3 blanks) + '   ' (word break) + 'c r e a m' (5 blanks)
  assert.equal(initial, '_ _ _   _ _ _ _ _');

  const revealed = generateHintDisplay('apple', [0, 4]);
  assert.equal(revealed, 'a _ _ _ e');
});

test('pickNextHintIndex only selects unrevealed valid letters', () => {
  const word = 'cat';
  const first = pickNextHintIndex(word, [0]);
  assert.ok(first === 1 || first === 2);

  const noneLeft = pickNextHintIndex(word, [0, 1, 2]);
  assert.equal(noneLeft, null);
});
