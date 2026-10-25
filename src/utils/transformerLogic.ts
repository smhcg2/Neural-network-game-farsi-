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
  stageScores: Record<number, number>; // stageIndex -> score (0 to 2)
  highestStreak: number;
  unlockedMedalIds: string[];
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
    // Mobile portrait: Camera sits directly in front of active layer at z: 32.0 (plenty of breathing room)
    return {
      position: {
        x: layerX,
        y: 0.2,
        z: 32.0,
      },
      lookAt: {
        x: layerX,
        y: 0.0,
        z: 0.0,
      },
    };
  } else {
    // Desktop: Comfortable distance looking slightly down the pipeline
    return {
      position: {
        x: layerX - 4.0,
        y: 1.5,
        z: 25.0,
      },
      lookAt: {
        x: layerX + 2.0,
        y: 0.2,
        z: 0.0,
      },
    };
  }
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
  const nodesPerLayer = 4;

  const layers: NetworkNodeData[][] = [];
  const targetPath: NetworkNodeData[] = [];

  for (let l = 0; l < numLayers; l++) {
    const layerNodes: NetworkNodeData[] = [];
    const correctWord = tokens[l];
    const isFirstLayer = l === 0;
    const nodesCount = isFirstLayer ? 1 : 4;

    // For layer 0: single prompt neuron at center. For layer > 0: 4 choices with 1 target.
    const targetNodeIdx = isFirstLayer ? 0 : Math.floor(rand() * nodesCount);

    for (let n = 0; n < nodesCount; n++) {
      const isTarget = isFirstLayer ? true : n === targetNodeIdx;
      const word = isTarget
        ? correctWord
        : distractorWords[(l * 5 + n + sentenceIndex) % distractorWords.length];

      const posX = startX + l * layerSpacing;
      // If single node, center at Y=0. Otherwise spread vertically: +4.6, +1.5, -1.5, -4.6
      const posY = isFirstLayer ? 0 : (n - (nodesCount - 1) / 2) * 4.6;
      const posZ = isFirstLayer ? 0 : (rand() - 0.5) * 1.5;

      const probability = isFirstLayer
        ? 1.0
        : isTarget
        ? Number((0.82 + rand() * 0.16).toFixed(3))
        : Number((rand() * 0.12).toFixed(3));

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
 * Calculates student score out of 20 based on completed stage scores.
 * 10 stages total, each stage up to 2.0 points.
 */
export function calculateGradeOutOf20(stageScores: Record<number, number>): {
  numericGrade: number;
  formattedGrade: string;
  rankTitle: string;
  color: string;
} {
  const sum = Object.values(stageScores).reduce((acc, curr) => acc + curr, 0);
  const numericGrade = Math.min(20, Math.max(0, Number(sum.toFixed(1))));

  let rankTitle = 'در حال ارزیابی';
  let color = '#00f3ff';

  if (numericGrade >= 19) {
    rankTitle = 'عالی و درخشان (نبوغ هوش مصنوعی) 🌟';
    color = '#10b981';
  } else if (numericGrade >= 16) {
    rankTitle = 'خیلی خوب (تسلط بالا) 👏';
    color = '#38bdf8';
  } else if (numericGrade >= 12) {
    rankTitle = 'قابل قبول (متوسط) 👍';
    color = '#f59e0b';
  } else if (numericGrade > 0) {
    rankTitle = 'نیازمند تمرین و یادگیری بیشتر 📚';
    color = '#f87171';
  }

  return {
    numericGrade,
    formattedGrade: numericGrade.toFixed(1),
    rankTitle,
    color,
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
