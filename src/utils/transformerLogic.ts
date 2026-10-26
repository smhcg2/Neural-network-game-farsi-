export interface NetworkNodeData {
  id: string;
  layer: number;
  nodeIndex: number;
  word: string;
  isTarget: boolean;
  tokenId: number;
  probability: number;
  posX: number;
  posY: number;
  posZ: number;
  isRevealed?: boolean;
  isUserChosen?: boolean;
}

export interface NetworkGraph {
  layers: NetworkNodeData[][];
  targetPath: NetworkNodeData[];
  totalLayers: number;
  sentence: string;
  sentenceIndex: number;
}

export interface UserProfile {
  name: string;
  avatarId: string;
  scoreOutOf20: number; // 0 to 20
  completedStages: number[];
  stageScores: Record<number, number>; // stageIndex -> score (0 to 1.0 each, total 10.0)
  quizScores: Record<string, number>; // checkpoint -> score (2.5 each, 4 quizzes = 10.0)
  highestStreak: number;
  unlockedMedalIds: string[];
  tutorialShownCount?: number;
  tutorialDismissed?: boolean;
}

/**
 * Splits sentence into clean tokens, trimming punctuation marks for game clarity.
 */
export function tokenizeSentence(sentence: string): string[] {
  if (!sentence || typeof sentence !== 'string') return [];
  return sentence
    .trim()
    .replace(/[؛،.!?؛\(\)\[\]]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Clamps current active step index within valid bounds.
 */
export function clampStep(currentStep: number, totalTokens: number): number {
  if (totalTokens <= 0) return 0;
  return Math.max(0, Math.min(currentStep, totalTokens - 1));
}

/**
 * Deterministic pseudo-random number generator for reproducible node graphs
 */
function pseudoRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Computes default game camera position and look-at target.
 * Set further back so all 4 vertical nodes are comfortably framed without being cut off.
 */
export function calculateGameCameraTarget(
  layerX: number,
  isMobile: boolean = false
): {
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
} {
  if (isMobile) {
    // Mobile portrait: Camera sits directly in front of active layer at z: 38.0,
    // with elevated Y target (2.4) so options are projected safely below the top floating HUD!
    return {
      position: {
        x: layerX,
        y: 2.4,
        z: 38.0,
      },
      lookAt: {
        x: layerX,
        y: 2.4,
        z: 0.0,
      },
    };
  } else {
    // Desktop: Comfortable distance looking slightly down the pipeline with safe clearance
    return {
      position: {
        x: layerX - 4.0,
        y: 2.0,
        z: 28.0,
      },
      lookAt: {
        x: layerX + 2.0,
        y: 1.5,
        z: 0.0,
      },
    };
  }
}

/**
 * Dynamic difficulty scaling:
 * - Stage 1 & 2 (index 0, 1): 2 options (1 correct + 1 distractor) - simple & clear for beginner learning
 * - Stage 3 & 4 (index 2, 3): 3 options (1 correct + 2 distractors)
 * - Stage 5 to 7 (index 4, 5, 6): 4 options (1 correct + 3 distractors)
 * - Stage 8 to 10 (index 7, 8, 9): 5 options (1 correct + 4 distractors) - high cognitive challenge
 */
export function getNodeCountForStage(sentenceIndex: number): number {
  if (sentenceIndex <= 1) return 2;
  if (sentenceIndex <= 3) return 3;
  if (sentenceIndex <= 6) return 4;
  return 5;
}

/**
 * Generates the full layer structure for the neural network token stream.
 */
export function generateLayerGraph(
  tokens: string[],
  distractorWords: string[],
  sentenceIndex: number = 0,
  seed: number = 42
): NetworkGraph {
  const rand = pseudoRandom(seed + sentenceIndex * 37);
  const numLayers = tokens.length;
  const layerSpacing = 12;
  const startX = -((numLayers - 1) * layerSpacing) / 2;

  const layers: NetworkNodeData[][] = [];
  const targetPath: NetworkNodeData[] = [];

  for (let l = 0; l < numLayers; l++) {
    const layerNodes: NetworkNodeData[] = [];
    const correctWord = tokens[l];
    const isFirstLayer = l === 0;
    const stageNodeCount = getNodeCountForStage(sentenceIndex);
    const nodesCount = isFirstLayer ? 1 : stageNodeCount;

    // For layer 0: single prompt neuron at center. For layer > 0: choices with 1 target.
    const targetNodeIdx = isFirstLayer ? 0 : Math.floor(rand() * nodesCount);

    // Spacing: compact vertical spread so options comfortably fit between top HUD and bottom dock
    const verticalSpread = nodesCount >= 5 ? 3.0 : nodesCount >= 4 ? 3.4 : 3.8;

    for (let n = 0; n < nodesCount; n++) {
      const isTarget = isFirstLayer ? true : n === targetNodeIdx;
      const word = isTarget
        ? correctWord
        : distractorWords[(l * 5 + n + sentenceIndex) % distractorWords.length];

      const posX = startX + l * layerSpacing;
      // If single node, center at Y=0. Otherwise spread vertically
      const posY = isFirstLayer ? 0 : (n - (nodesCount - 1) / 2) * verticalSpread;
      const posZ = isFirstLayer ? 0 : (rand() - 0.5) * 1.5;

      // Realistic Softmax probability distribution:
      // When 2 nodes: target ~85-95%, distractor ~5-15%
      // When 5 nodes: target ~55-70%, distractors ~5-15%
      const baseTargetProb = nodesCount === 2 ? 0.88 : nodesCount === 3 ? 0.78 : nodesCount === 4 ? 0.70 : 0.60;
      const probability = isFirstLayer
        ? 1.0
        : isTarget
        ? Number((baseTargetProb + rand() * 0.08).toFixed(3))
        : Number((rand() * ((1.0 - baseTargetProb) / (nodesCount - 1))).toFixed(3));

      const tokenId = Math.floor(rand() * 40000) + 10000;

      const nodeData: NetworkNodeData = {
        id: `node-${l}-${n}`,
        layer: l,
        nodeIndex: n,
        word,
        isTarget,
        tokenId,
        probability,
        posX,
        posY,
        posZ,
        isRevealed: isFirstLayer,
        isUserChosen: isFirstLayer,
      };

      layerNodes.push(nodeData);
      if (isTarget) {
        targetPath.push(nodeData);
      }
    }
    layers.push(layerNodes);
  }

  return {
    layers,
    targetPath,
    totalLayers: numLayers,
    sentence: tokens.join(' '),
    sentenceIndex,
  };
}

/**
 * Calculates student score out of 20:
 * - 10 stages: max 10.0 points (1.0 point each)
 * - 4 quizzes: max 10.0 points (2.5 points each)
 * Total: 20.0 points!
 */
export function calculateGradeOutOf20(
  stageScores: Record<number, number> = {},
  quizScores: Record<string, number> = {}
): {
  numericGrade: number;
  formattedGrade: string;
  rankTitle: string;
  color: string;
  stageTotal: number;
  quizTotal: number;
} {
  const stageTotal = Math.min(10.0, Object.values(stageScores).reduce((acc, curr) => acc + curr, 0));
  const quizTotal = Math.min(10.0, Object.values(quizScores).reduce((acc, curr) => acc + curr, 0));
  const numericGrade = Math.min(20.0, Math.max(0, Number((stageTotal + quizTotal).toFixed(1))));

  let rankTitle = 'در حال ارزیابی';
  let color = '#00f3ff';

  if (numericGrade >= 18.5) {
    rankTitle = 'عالی و درخشان (نبوغ هوش مصنوعی) 👑';
    color = '#10b981';
  } else if (numericGrade >= 15.0) {
    rankTitle = 'خیلی خوب (تسلط بالا) 👏';
    color = '#38bdf8';
  } else if (numericGrade >= 10.0) {
    rankTitle = 'قابل قبول (کارآموز شبکه عصبی) 👍';
    color = '#f59e0b';
  } else if (numericGrade > 0) {
    rankTitle = 'کاشف نوپا (نیازمند تمرین بیشتر) 🌱';
    color = '#f87171';
  }

  return {
    numericGrade,
    formattedGrade: numericGrade.toFixed(1),
    rankTitle,
    color,
    stageTotal: Number(stageTotal.toFixed(1)),
    quizTotal: Number(quizTotal.toFixed(1)),
  };
}

/**
 * Adaptive learning hint for struggling players who miss a word multiple times.
 */
export function generateSmartHintForStrugglingPlayer(
  targetWord: string,
  previousWord?: string
): string {
  const firstChar = targetWord.charAt(0);
  if (previousWord) {
    return `💡 آموزش شبکه عصبی: بعد از کلمه «${previousWord}»، شبکه کلمه‌ای را انتخاب می‌کند که با حرف «${firstChar}» شروع می‌شود و بیشترین هماهنگی معنایی را دارد.`;
  }
  return `💡 آموزش شبکه عصبی: کلمه صحیح با حرف «${firstChar}» شروع می‌شود و دارای بالاترین احتمال در این لایه است.`;
}

/**
 * Evaluates the player's guess on a tapped 3D node.
 */
export function evaluateInGameGuess(
  nodeData: NetworkNodeData,
  currentStreak: number = 0,
  attemptsOnLayer: number = 0
): {
  isCorrect: boolean;
  pointsEarned: number;
  newStreak: number;
  feedbackText: string;
} {
  if (nodeData.isTarget) {
    const streakBonus = Math.min(currentStreak * 15, 60);
    const firstTryBonus = attemptsOnLayer === 0 ? 50 : 20;
    const pointsEarned = 100 + firstTryBonus + streakBonus;
    const newStreak = currentStreak + 1;
    const feedbackText =
      newStreak > 1
        ? `🔥 آفرین! پیش‌بینی درست بود (${newStreak}x کمبو پیاپی!) +${pointsEarned} XP`
        : `✨ عالی! کلمه «${nodeData.word}» توکن بعدی مدل است! +${pointsEarned} XP`;

    return {
      isCorrect: true,
      pointsEarned,
      newStreak,
      feedbackText,
    };
  } else {
    return {
      isCorrect: false,
      pointsEarned: 0,
      newStreak: 0,
      feedbackText: `❌ کلمه «${nodeData.word}» احتمال کمتری دارد (${Math.round(
        nodeData.probability * 100
      )}%). دوباره نورون دیگری را امتحان کن!`,
    };
  }
}
