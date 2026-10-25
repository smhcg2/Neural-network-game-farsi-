/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  PRESET_SENTENCES,
  DISTRACTOR_WORDS,
  THEMES,
  ThemeColor,
  INITIAL_MEDALS,
  getRandomSentenceForStage,
  STAGE_THEMES,
  TUTORIAL_QUIZZES,
  QuizQuestion,
} from './utils/constants.ts';
import {
  tokenizeSentence,
  generateLayerGraph,
  calculateGradeOutOf20,
  UserProfile,
  NetworkNodeData,
} from './utils/transformerLogic.ts';
import { soundManager } from './utils/soundEffects.ts';
import { NeuralNetworkCanvas } from './components/NeuralNetworkCanvas.tsx';
import { InGameHUD } from './components/InGameHUD.tsx';
import { MainMenu } from './components/MainMenu.tsx';
import { TutorialModal } from './components/TutorialModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ShareCardModal } from './components/ShareCardModal.tsx';
import { QuizModal } from './components/QuizModal.tsx';

const STORAGE_KEY = 'neuroland_user_profile_v3';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  avatarId: 'programmer',
  scoreOutOf20: 0,
  completedStages: [],
  stageScores: {},
  highestStreak: 0,
  unlockedMedalIds: [],
};

export default function App() {
  // Load saved profile from localStorage
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_PROFILE;
  });

  // Modal and screen navigation states
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(() => !userProfile.name);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShareCardOpen, setIsShareCardOpen] = useState<boolean>(false);

  // Helper for progressive countdown timer in higher stages (stages 6-10)
  const getInitialTimeForStage = useCallback((stageIdx: number): number | null => {
    if (stageIdx < 5) return null; // Stages 1 to 5 are relaxed and untimed
    switch (stageIdx) {
      case 5: return 28; // Stage 6
      case 6: return 25; // Stage 7
      case 7: return 22; // Stage 8
      case 8: return 20; // Stage 9
      case 9: return 18; // Stage 10
      default: return 20;
    }
  }, []);

  // Gameplay state:
  // Layer 0 is the starting prompt token (1 neuron, already given).
  // The player's active challenge always starts at index 1!
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number>(0);
  const [currentSentence, setCurrentSentence] = useState<string>(() => getRandomSentenceForStage(0));
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1);
  const [score, setScore] = useState<number>(0); // Total gamified XP
  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(userProfile.highestStreak || 0);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'warning' | null>(null);
  const [noiseIntensity, setNoiseIntensity] = useState<number>(0.35);
  const [theme, setTheme] = useState<ThemeColor>(STAGE_THEMES[0] || THEMES[0]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(() => getInitialTimeForStage(0));
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);

  // Camera & interaction state
  const [resetCameraTrigger, setResetCameraTrigger] = useState<number>(0);
  const [isCameraCustomized, setIsCameraCustomized] = useState<boolean>(false);
  const [highlightHintNodeId, setHighlightHintNodeId] = useState<string | null>(null);
  const [strugglingAttempts, setStrugglingAttempts] = useState<number>(0);

  // Track attempts on current stage to calculate 0 to 2.0 stage score
  const stageAttemptsRef = useRef<{ total: number; mistakes: number }>({ total: 0, mistakes: 0 });
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync profile to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    } catch {
      // LocalStorage might fail in private or restricted mode
    }
  }, [userProfile]);

  // Compute tokens and graph for current sentence
  const tokens = useMemo(() => tokenizeSentence(currentSentence), [currentSentence]);

  const graph = useMemo(() => {
    return generateLayerGraph(tokens, DISTRACTOR_WORDS, currentSentenceIdx, 100 + currentSentenceIdx);
  }, [tokens, currentSentenceIdx]);

  // Reset to step 1 when sentence index changes
  useEffect(() => {
    setCurrentStepIndex(1);
    setFeedbackText(null);
    setHighlightHintNodeId(null);
    setStrugglingAttempts(0);
    setTimeRemaining(getInitialTimeForStage(currentSentenceIdx));
    stageAttemptsRef.current = { total: 0, mistakes: 0 };
  }, [currentSentenceIdx, getInitialTimeForStage]);

  // Show temporary feedback toast in 3D scene
  const triggerFeedback = useCallback((text: string, type: 'success' | 'warning') => {
    setFeedbackText(text);
    setFeedbackType(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackText(null);
      setFeedbackType(null);
    }, 2500);
  }, []);

  // Medal unlocking checker
  const checkMedals = useCallback(
    (newStreak: number, completedStages: number[], stageScores: Record<number, number>) => {
      setUserProfile((prev) => {
        const unlocked = new Set(prev.unlockedMedalIds || []);

        // 1. First step medal
        if (completedStages.length >= 1) {
          unlocked.add('first_step');
        }
        // 2. Halfway medal
        if (completedStages.length >= 5) {
          unlocked.add('halfway');
        }
        // 3. Master medal (all 10)
        if (completedStages.length >= PRESET_SENTENCES.length) {
          unlocked.add('master');
        }
        // 4. Combo King (5 streak)
        if (newStreak >= 5) {
          unlocked.add('combo_king');
        }
        // 5. Perfect 20/20 score
        const grade = calculateGradeOutOf20(stageScores);
        if (grade.numericGrade >= 20.0) {
          unlocked.add('genius_score');
        }

        const newUnlockedList = Array.from(unlocked);
        if (newUnlockedList.length !== (prev.unlockedMedalIds?.length || 0)) {
          return {
            ...prev,
            unlockedMedalIds: newUnlockedList,
          };
        }
        return prev;
      });
    },
    []
  );

  // Helper to record stage completion and grade out of 20
  const completeCurrentStage = useCallback(
    (stageIdx: number) => {
      const mistakes = stageAttemptsRef.current.mistakes;
      const stageScore = Math.max(0.5, Number((2.0 - mistakes * 0.3).toFixed(1)));

      setUserProfile((prevProfile) => {
        const updatedCompleted = Array.from(new Set([...prevProfile.completedStages, stageIdx]));
        const updatedStageScores = {
          ...prevProfile.stageScores,
          [stageIdx]: Math.max(prevProfile.stageScores[stageIdx] || 0, stageScore),
        };
        const totalGrade = calculateGradeOutOf20(updatedStageScores);
        checkMedals(streak, updatedCompleted, updatedStageScores);

        return {
          ...prevProfile,
          completedStages: updatedCompleted,
          stageScores: updatedStageScores,
          scoreOutOf20: totalGrade.numericGrade,
        };
      });
    },
    [checkMedals, streak]
  );

  // Automatically record completion when reaching beyond the final token
  useEffect(() => {
    if (currentStepIndex >= graph.totalLayers && graph.totalLayers > 0) {
      soundManager.playVictory();
      completeCurrentStage(currentSentenceIdx);
    }
  }, [currentStepIndex, graph.totalLayers, currentSentenceIdx, completeCurrentStage]);

  // Progressive countdown timer for stages 6-10
  useEffect(() => {
    if (timeRemaining === null) return;
    if (isMenuOpen || isTutorialOpen || isSettingsOpen || isShareCardOpen || activeQuiz !== null) return;
    if (currentStepIndex >= graph.totalLayers) return; // Stage already completed

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Time ran out!
          soundManager.playWrong();
          triggerFeedback('⏳ زمان به پایان رسید! کلمه را دوباره پیدا کن', 'warning');
          setCurrentStepIndex(1);
          setStrugglingAttempts((s) => s + 1);
          return getInitialTimeForStage(currentSentenceIdx);
        }
        const nextTime = prev - 1;
        if (nextTime <= 5) {
          soundManager.playTimerTick();
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    timeRemaining,
    isMenuOpen,
    isTutorialOpen,
    isSettingsOpen,
    isShareCardOpen,
    activeQuiz,
    currentStepIndex,
    graph.totalLayers,
    currentSentenceIdx,
    getInitialTimeForStage,
    triggerFeedback,
  ]);

  // When player guesses directly on a 3D node
  const handleGuessResult = useCallback(
    (result: {
      isCorrect: boolean;
      pointsEarned: number;
      newStreak: number;
      feedbackText: string;
      tappedNode: NetworkNodeData;
    }) => {
      stageAttemptsRef.current.total += 1;

      if (result.isCorrect) {
        soundManager.playCorrect();
        setTimeRemaining(getInitialTimeForStage(currentSentenceIdx));
        setScore((prev) => prev + result.pointsEarned);
        setStreak(result.newStreak);
        setHighestStreak((prev) => {
          const next = Math.max(prev, result.newStreak);
          setUserProfile((p) => ({ ...p, highestStreak: Math.max(p.highestStreak || 0, next) }));
          return next;
        });
        setStrugglingAttempts(0);
        setHighlightHintNodeId(null);
        triggerFeedback(result.feedbackText, 'success');

        // Check streak medals
        checkMedals(result.newStreak, userProfile.completedStages, userProfile.stageScores);
      } else {
        soundManager.playWrong();
        stageAttemptsRef.current.mistakes += 1;
        setScore((prev) => Math.max(0, prev + result.pointsEarned));
        setStreak(0);
        const nextAttempts = strugglingAttempts + 1;
        setStrugglingAttempts(nextAttempts);

        // If player struggles (>= 2 attempts on the same word), illuminate the target node in 3D
        if (nextAttempts >= 2) {
          const targetNode = graph.targetPath[currentStepIndex];
          if (targetNode) {
            setHighlightHintNodeId(targetNode.id);
          }
        }

        triggerFeedback(result.feedbackText, 'warning');
      }
    },
    [
      currentSentenceIdx,
      getInitialTimeForStage,
      triggerFeedback,
      strugglingAttempts,
      graph.targetPath,
      currentStepIndex,
      checkMedals,
      userProfile.completedStages,
      userProfile.stageScores,
    ]
  );

  // Advance to next layer (called automatically after correct guess)
  const handleAdvanceToNextLayer = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = prev + 1;
      if (next >= graph.totalLayers) {
        soundManager.playVictory();
        completeCurrentStage(currentSentenceIdx);
      }
      return next;
    });
  }, [graph.totalLayers, currentSentenceIdx, completeCurrentStage]);

  // Stage transition helper
  const proceedToStage = useCallback((nextIdx: number) => {
    setCurrentSentenceIdx(nextIdx);
    setCurrentSentence(getRandomSentenceForStage(nextIdx));
    setTheme(STAGE_THEMES[nextIdx % STAGE_THEMES.length] || THEMES[0]);
    soundManager.playNextStage();
    triggerFeedback('🎉 مرحله جدید آغاز شد! آماده انتخاب توکن بعدی شو', 'success');
  }, [triggerFeedback]);

  // Next stage (with tutorial checkpoint quizzes every 3 stages)
  const handleNextStage = useCallback(() => {
    completeCurrentStage(currentSentenceIdx);
    setScore((prev) => prev + 250);

    // Check if checkpoint quiz exists for this stage (after stage 3, 6, 9)
    const quiz = TUTORIAL_QUIZZES[currentSentenceIdx];
    if (quiz) {
      setActiveQuiz(quiz);
    } else {
      const nextStage = (currentSentenceIdx + 1) % 10;
      proceedToStage(nextStage);
    }
  }, [completeCurrentStage, currentSentenceIdx, proceedToStage]);

  // When player completes the 4-choice checkpoint quiz
  const handleQuizComplete = useCallback((earnedXp: number) => {
    setScore((prev) => prev + earnedXp);
    setActiveQuiz(null);
    const nextStage = (currentSentenceIdx + 1) % 10;
    proceedToStage(nextStage);
  }, [currentSentenceIdx, proceedToStage]);

  // Reset stage
  const handleResetStage = useCallback(() => {
    setCurrentStepIndex(1); // Reset to layer 1 (layer 0 is prompt)
    setStrugglingAttempts(0);
    setHighlightHintNodeId(null);
    setTimeRemaining(getInitialTimeForStage(currentSentenceIdx));
    stageAttemptsRef.current = { total: 0, mistakes: 0 };
    triggerFeedback('مرحله بازنشانی شد. کلمه دوم را حدس بزن!', 'success');
  }, [currentSentenceIdx, getInitialTimeForStage, triggerFeedback]);

  // User selects stage directly
  const handleSelectSentence = useCallback((idx: number) => {
    setCurrentSentenceIdx(idx);
    setCurrentSentence(getRandomSentenceForStage(idx));
    setTheme(STAGE_THEMES[idx % STAGE_THEMES.length] || THEMES[0]);
  }, []);

  // Hint button: reveals helpful context and temporarily highlights target node
  const handleTriggerHint = useCallback(() => {
    const targetNode = graph.targetPath[currentStepIndex];
    if (targetNode) {
      setHighlightHintNodeId(targetNode.id);
      const firstChar = targetNode.word.charAt(0);
      triggerFeedback(
        `💡 راهنمایی: کلمه بعدی با حرف «${firstChar}» شروع می‌شود و دارای بالاترین احتمال (${Math.round(
          targetNode.probability * 100
        )}%) است!`,
        'warning'
      );
    }
  }, [graph.targetPath, currentStepIndex, triggerFeedback]);

  // Reset camera to default game perspective
  const handleResetCamera = useCallback(() => {
    setResetCameraTrigger((prev) => prev + 1);
    setIsCameraCustomized(false);
    triggerFeedback('🎥 زاویه دید (Viewport) به حالت پیش‌فرض بازنشانی شد', 'success');
  }, [triggerFeedback]);

  // Start new game handler
  const handleStartNewGame = useCallback((name: string, avatarId: string) => {
    setUserProfile((prev) => ({
      ...prev,
      name,
      avatarId,
    }));
    setIsMenuOpen(false);
    setCurrentSentenceIdx(0);
    setCurrentSentence(getRandomSentenceForStage(0));
    setTheme(STAGE_THEMES[0] || THEMES[0]);
    setCurrentStepIndex(1);
    setTimeRemaining(getInitialTimeForStage(0));
  }, [getInitialTimeForStage]);

  // Resume game handler
  const handleResumeGame = useCallback(() => {
    setIsMenuOpen(false);
    const lastUncompleted = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find(
      (idx) => !userProfile.completedStages.includes(idx)
    );
    const targetIdx = lastUncompleted !== undefined ? lastUncompleted : 0;
    setCurrentSentenceIdx(targetIdx);
    setCurrentSentence(getRandomSentenceForStage(targetIdx));
    setTheme(STAGE_THEMES[targetIdx % STAGE_THEMES.length] || THEMES[0]);
    setCurrentStepIndex(1);
    setTimeRemaining(getInitialTimeForStage(targetIdx));
  }, [userProfile.completedStages, getInitialTimeForStage]);

  // Update profile from settings
  const handleUpdateProfile = useCallback((name: string, avatarId: string) => {
    setUserProfile((prev) => ({ ...prev, name, avatarId }));
  }, []);

  // Reset progress from settings
  const handleResetProgress = useCallback(() => {
    const freshProfile: UserProfile = {
      name: userProfile.name,
      avatarId: userProfile.avatarId,
      scoreOutOf20: 0,
      completedStages: [],
      stageScores: {},
      highestStreak: 0,
      unlockedMedalIds: [],
    };
    setUserProfile(freshProfile);
    setScore(0);
    setStreak(0);
    setCurrentSentenceIdx(0);
    setCurrentStepIndex(1);
    triggerFeedback('تمام پیشرفت‌ها بازنشانی شدند.', 'warning');
  }, [userProfile.name, userProfile.avatarId, triggerFeedback]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isMenuOpen || isTutorialOpen || isSettingsOpen || isShareCardOpen) return;

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleTriggerHint();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleResetCamera();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetStage();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isMenuOpen,
    isTutorialOpen,
    isSettingsOpen,
    isShareCardOpen,
    handleTriggerHint,
    handleResetCamera,
    handleResetStage,
  ]);

  const hasSavedGame = Boolean(userProfile.name && userProfile.completedStages.length > 0);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#030712] select-none text-gray-100 font-sans"
      data-testid="transformer-game-root"
      data-stage={currentSentenceIdx + 1}
      data-step={currentStepIndex}
    >
      {/* 3D Neural Network Game Canvas */}
      <NeuralNetworkCanvas
        graph={graph}
        currentStepIndex={currentStepIndex}
        theme={theme}
        noiseIntensity={noiseIntensity}
        streak={streak}
        resetCameraTrigger={resetCameraTrigger}
        highlightHintNodeId={highlightHintNodeId}
        onCameraIsCustomized={setIsCameraCustomized}
        onGuessResult={handleGuessResult}
        onAdvanceToNextLayer={handleAdvanceToNextLayer}
      />

      {/* Hologram Scanline Effect */}
      <div className="pointer-events-none absolute inset-0 scanline z-10 opacity-30" />

      {/* In-Game HUD Overlay (Minimal bottom dock, in-scene prompt, 0-20 score pill) */}
      {!isMenuOpen && (
        <InGameHUD
          graph={graph}
          currentSentenceIdx={currentSentenceIdx}
          currentStepIndex={currentStepIndex}
          score={score}
          streak={streak}
          highestStreak={highestStreak}
          userProfile={userProfile}
          feedbackText={feedbackText}
          feedbackType={feedbackType}
          isCameraCustomized={isCameraCustomized}
          strugglingAttempts={strugglingAttempts}
          timeRemaining={timeRemaining}
          onSelectSentence={handleSelectSentence}
          onResetStage={handleResetStage}
          onNextStage={handleNextStage}
          onTriggerHint={handleTriggerHint}
          onResetCamera={handleResetCamera}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShareCard={() => setIsShareCardOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
        />
      )}

      {/* Main Menu Modal / Landing Screen */}
      {isMenuOpen && (
        <MainMenu
          userProfile={userProfile}
          hasSavedGame={hasSavedGame}
          onStartNewGame={handleStartNewGame}
          onResumeGame={handleResumeGame}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShareCard={() => setIsShareCardOpen(true)}
        />
      )}

      {/* Educational Tutorial Modal */}
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

      {/* Settings Modal (Themes, Noise, Profile, Audio, Eitaa Support) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onChangeTheme={setTheme}
        noiseIntensity={noiseIntensity}
        onChangeNoise={setNoiseIntensity}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        onResetProgress={handleResetProgress}
      />

      {/* Shareable 0-20 Report Card & Medals Modal */}
      <ShareCardModal
        isOpen={isShareCardOpen}
        onClose={() => setIsShareCardOpen(false)}
        userProfile={userProfile}
      />

      {/* Checkpoint Quiz Modal (Between stages: after stages 3, 6, 9) */}
      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz}
          isOpen={Boolean(activeQuiz)}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  );
}
