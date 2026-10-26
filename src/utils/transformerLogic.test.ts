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
  assert.equal(mobileCam.position.y, 2.4); // elevated Y target clears top menu
  assert.equal(mobileCam.position.z, 38.0); // comfortably distant

  const desktopCam = calculateGameCameraTarget(layerX, false);
  assert.equal(desktopCam.position.x, 8.0);
  assert.equal(desktopCam.position.z, 28.0);
});

test('calculateGradeOutOf20 calculates correct educational scores and rank titles', () => {
  // 10 stages (1.0 each) + 4 quizzes (2.5 each)
  const perfectStages: Record<number, number> = {};
  for (let i = 0; i < 10; i++) perfectStages[i] = 1.0;
  const perfectQuizzes: Record<string, number> = { q1: 2.5, q2: 2.5, q3: 2.5, q4: 2.5 };

  const result20 = calculateGradeOutOf20(perfectStages, perfectQuizzes);
  assert.equal(result20.numericGrade, 20.0);
  assert.equal(result20.formattedGrade, '20.0');
  assert.ok(result20.rankTitle.includes('عالی'));

  // Partial score: 7.0 from stages + 5.0 from quizzes = 12.0
  const partialStages = { 0: 1, 1: 0.8, 2: 1, 3: 0.7, 4: 1, 5: 1, 6: 0.5, 7: 1 };
  const partialQuizzes = { q1: 2.5, q2: 2.5 };
  const result12 = calculateGradeOutOf20(partialStages, partialQuizzes);
  assert.equal(result12.stageTotal, 7.0);
  assert.equal(result12.quizTotal, 5.0);
  assert.equal(result12.numericGrade, 12.0);
  assert.ok(result12.rankTitle.includes('قابل قبول'));
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

test('generateLayerGraph scales options progressively from 2 to 5 nodes per layer', () => {
  const tokens = ['هر', 'شب', 'تاریکی'];
  // Stage 0 (Stage 1): 2 options
  const graphStage0 = generateLayerGraph(tokens, ['امید', 'تلاش', 'صبر', 'نور', 'شادی'], 0);
  assert.equal(graphStage0.layers[0].length, 1); // Layer 0 is single prompt
  assert.equal(graphStage0.layers[1].length, 2); // 2 options for beginner stage 1
  assert.equal(graphStage0.layers[2].length, 2);

  // Stage 2 (Stage 3): 3 options
  const graphStage2 = generateLayerGraph(tokens, ['امید', 'تلاش', 'صبر', 'نور', 'شادی'], 2);
  assert.equal(graphStage2.layers[1].length, 3);

  // Stage 5 (Stage 6): 4 options
  const graphStage5 = generateLayerGraph(tokens, ['امید', 'تلاش', 'صبر', 'نور', 'شادی'], 5);
  assert.equal(graphStage5.layers[1].length, 4);

  // Stage 8 (Stage 9): 5 options
  const graphStage8 = generateLayerGraph(tokens, ['امید', 'تلاش', 'صبر', 'نور', 'شادی'], 8);
  assert.equal(graphStage8.layers[1].length, 5);
});
