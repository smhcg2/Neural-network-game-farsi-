import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenizeSentence,
  clampStep,
  calculateGameCameraTarget,
  generateLayerGraph,
  calculateGradeOutOf20,
  generateSmartHintForStrugglingPlayer,
  evaluateInGameGuess,
} from './transformerLogic.ts';
import { PRESET_SENTENCES } from './constants.ts';

test('tokenizeSentence handles Persian sentences with punctuation marks cleanly', () => {
  const sent = 'هر شب تاریک، سرآغاز یک روز روشن است!';
  const tokens = tokenizeSentence(sent);
  assert.equal(tokens[0], 'هر');
  assert.equal(tokens[1], 'شب');
  assert.equal(tokens[tokens.length - 1], 'است');

  const presetTokens = tokenizeSentence(PRESET_SENTENCES[0]);
  assert.equal(presetTokens[0], 'امید');
  assert.ok(presetTokens.length > 2);
});

test('calculateGameCameraTarget sets comfortable distance on mobile and desktop', () => {
  const layerX = 12;
  const mobileCam = calculateGameCameraTarget(layerX, true);
  assert.equal(mobileCam.position.x, 12);
  assert.equal(mobileCam.position.z, 32.0); // comfortably distant

  const desktopCam = calculateGameCameraTarget(layerX, false);
  assert.equal(desktopCam.position.x, 8.0);
  assert.equal(desktopCam.position.z, 25.0);
});

test('calculateGradeOutOf20 calculates correct educational scores and rank titles', () => {
  // 10 stages with perfect 2.0 scores
  const perfectStages: Record<number, number> = {};
  for (let i = 0; i < 10; i++) perfectStages[i] = 2.0;

  const result20 = calculateGradeOutOf20(perfectStages);
  assert.equal(result20.numericGrade, 20);
  assert.equal(result20.formattedGrade, '20.0');
  assert.ok(result20.rankTitle.includes('عالی'));

  // Partial score 14.5
  const partialStages = { 0: 2, 1: 1.5, 2: 2, 3: 1, 4: 2, 5: 2, 6: 2, 7: 2 };
  const result14 = calculateGradeOutOf20(partialStages);
  assert.equal(result14.numericGrade, 14.5);
  assert.ok(result14.rankTitle.includes('قابل قبول'));
});

test('generateSmartHintForStrugglingPlayer gives constructive guidance', () => {
  const hint = generateSmartHintForStrugglingPlayer('روشن', 'فردای');
  assert.ok(hint.includes('فردای'));
  assert.ok(hint.includes('ر'));
});

test('evaluateInGameGuess awards points and calculates streaks', () => {
  const targetNode = {
    id: 'n1',
    layer: 0,
    nodeIndex: 0,
    word: 'شب',
    isTarget: true,
    tokenId: 12345,
    probability: 0.95,
    posX: 0,
    posY: 0,
    posZ: 0,
  };
  const correct = evaluateInGameGuess(targetNode, 2, 0);
  assert.equal(correct.isCorrect, true);
  assert.equal(correct.newStreak, 3);
  assert.ok(correct.pointsEarned > 100);

  const wrongNode = { ...targetNode, isTarget: false, probability: 0.05, word: 'اشتباه' };
  const wrong = evaluateInGameGuess(wrongNode, 3, 0);
  assert.equal(wrong.isCorrect, false);
  assert.equal(wrong.newStreak, 0);
  assert.equal(wrong.pointsEarned, 0);
});

test('generateLayerGraph creates exactly 1 prompt neuron in layer 0 and 4 in subsequent layers', () => {
  const tokens = ['هر', 'شب', 'تاریکی'];
  const graph = generateLayerGraph(tokens, ['امید', 'تلاش', 'صبر'], 0);
  assert.equal(graph.layers[0].length, 1);
  assert.equal(graph.layers[0][0].word, 'هر');
  assert.equal(graph.layers[0][0].isTarget, true);
  assert.equal(graph.layers[1].length, 4);
  assert.equal(graph.layers[2].length, 4);
});
