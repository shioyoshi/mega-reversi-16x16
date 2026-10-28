import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  GameState,
  UserProfile,
  Exercise,
  UpgradeItem,
  MuscleGroup,
  FloatingText,
} from './types/game';
import {
  defaultProfile,
  createInitialGameState,
  initialExercises,
  initialUpgrades,
  initialAchievements,
} from './data/initialData';
import {
  calculatePlayerLevel,
  estimateInitialStats,
  calculateCurrent1RM,
  formatNumber,
} from './utils/calc';
import { soundManager } from './utils/audio';

import { ThreeGymCanvas } from './components/ThreeGymCanvas';
import { ExerciseCarousel } from './components/ExerciseCarousel';
import { ProfileModal } from './components/ProfileModal';
import { MuscleMap } from './components/MuscleMap';
import { NutritionShop } from './components/NutritionShop';
import { AchievementsModal } from './components/AchievementsModal';
import { WorkoutSummary } from './components/WorkoutSummary';
import { FloatingNumbers } from './components/FloatingNumbers';

const STORAGE_KEY = 'pump_hero_game_state_v2'; // キーをv2に上げてクリーンに移行

export const App: React.FC = () => {
  // 安全なゲームステートのロード＆マイグレーション
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('pump_hero_game_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const fallback = createInitialGameState(parsed.profile || defaultProfile);

        // 種目の欠損補完
        const mergedExercises = fallback.exercises.map((fEx) => {
          const found = parsed.exercises?.find((pEx: Exercise) => pEx.id === fEx.id);
          return found ? { ...fEx, ...found } : fEx;
        });

        // アップグレードの欠損補完
        const mergedUpgrades = fallback.upgrades.map((fUp) => {
          const found = parsed.upgrades?.find((pUp: UpgradeItem) => pUp.id === fUp.id);
          return found ? { ...fUp, ...found } : fUp;
        });

        return {
          ...fallback,
          ...parsed,
          profile: parsed.profile || defaultProfile,
          exercises: mergedExercises.length > 0 ? mergedExercises : fallback.exercises,
          upgrades: mergedUpgrades.length > 0 ? mergedUpgrades : fallback.upgrades,
          achievements: parsed.achievements || fallback.achievements,
        };
      }
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
    return createInitialGameState(defaultProfile);
  });

  // 現在選択中の種目ID
  const [currentExerciseId, setCurrentExerciseId] = useState<string>('pushup');

  // レップアニメーショントリガー
  const [repTrigger, setRepTrigger] = useState<number>(0);
  const [isPressingRep, setIsPressingRep] = useState(false);

  // UIモーダル＆サイドパネル制御
  const [isProfileOpen, setIsProfileOpen] = useState(!state.profile.isInitialized);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAnatomyOpen, setIsAnatomyOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

  // 浮遊エフェクト
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const floatingIdRef = useRef(0);

  // ステートの自動保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Save error:', e);
    }
  }, [state]);

  // 現在の選択種目オブジェクト（絶対にundefinedにならないようフォールバック）
  const currentExercise: Exercise =
    state.exercises.find((e) => e.id === currentExerciseId) ||
    state.exercises[0] ||
    initialExercises[0];

  // 実績チェック
  const checkAchievements = (currentState: GameState) => {
    let newlyUnlocked = false;
    const updatedAchievements = currentState.achievements.map((ach) => {
      if (!ach.unlocked && ach.check(currentState)) {
        newlyUnlocked = true;
        soundManager.playLevelUp();
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
        return {
          ...ach,
          unlocked: true,
          unlockedAt: new Date().toISOString(),
        };
      }
      return ach;
    });

    if (newlyUnlocked) {
      return { ...currentState, achievements: updatedAchievements };
    }
    return currentState;
  };

  // 種目アンロック条件のチェック
  const checkExerciseUnlocks = (currentState: GameState): Exercise[] => {
    return currentState.exercises.map((ex) => {
      if (ex.unlocked) return ex;

      let canUnlock = false;
      const req = ex.unlockRequirement;

      if (req) {
        if (req.gymUnlocked && !currentState.hasGymMembership) {
          canUnlock = false;
        } else {
          canUnlock = true;
          if (req.userLevel && currentState.playerLevel < req.userLevel) {
            canUnlock = false;
          }
          if (req.totalReps && currentState.totalReps < req.totalReps) {
            canUnlock = false;
          }
          if (req.exerciseLevel) {
            const targetEx = currentState.exercises.find((e) => e.id === req.exerciseLevel?.id);
            if (!targetEx || targetEx.level < req.exerciseLevel.level) {
              canUnlock = false;
            }
          }
          if (req.muscle) {
            if (currentState.muscleStats[req.muscle.group] < req.muscle.level) {
              canUnlock = false;
            }
          }
        }
      }

      if (canUnlock) {
        soundManager.playLevelUp();
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.6 },
        });
        return { ...ex, unlocked: true };
      }
      return ex;
    });
  };

  // 放置タイマーループ (毎秒実行)
  useEffect(() => {
    const timer = setInterval(() => {
      setState((prev) => {
        let {
          totalMuscleExp,
          lifetimeMuscleExp,
          pumpGauge,
          isPumpMode,
          pumpTimeRemaining,
          fatigue,
          upgrades,
        } = prev;

        const passivePerSec = upgrades.reduce(
          (sum, u) => sum + u.passiveExpPerSec * u.ownedCount,
          0
        );

        if (passivePerSec > 0) {
          totalMuscleExp += passivePerSec;
          lifetimeMuscleExp += passivePerSec;
        }

        const recoveryRate = upgrades.reduce(
          (mult, u) => mult * Math.pow(u.fatigueRecoveryMultiplier, u.ownedCount),
          1.0
        );
        fatigue = Math.max(0, fatigue - 0.5 * recoveryRate);

        if (isPumpMode) {
          pumpTimeRemaining -= 1;
          if (pumpTimeRemaining <= 0) {
            isPumpMode = false;
            pumpTimeRemaining = 0;
            pumpGauge = 0;
          }
        } else {
          pumpGauge = Math.max(0, pumpGauge - 0.35);
        }

        const newPlayerLevel = calculatePlayerLevel(lifetimeMuscleExp);

        let nextState: GameState = {
          ...prev,
          totalMuscleExp,
          lifetimeMuscleExp,
          playerLevel: newPlayerLevel,
          pumpGauge,
          isPumpMode,
          pumpTimeRemaining,
          fatigue,
          lastSavedTimestamp: Date.now(),
        };

        nextState.exercises = checkExerciseUnlocks(nextState);
        nextState = checkAchievements(nextState);

        return nextState;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 1レップ実行 (3Dアニメーション + サウンド + 経験値獲得)
  const handlePerformRep = (clientX?: number, clientY?: number) => {
    if (!currentExercise.unlocked) return;

    soundManager.playRep(currentExercise.category === 'gym');
    setRepTrigger((prev) => prev + 1);
    setIsPressingRep(true);
    setTimeout(() => setIsPressingRep(false), 140);

    setState((prev) => {
      let {
        totalMuscleExp,
        lifetimeMuscleExp,
        totalReps,
        totalLiftedKg,
        fatigue,
        pumpGauge,
        isPumpMode,
        pumpTimeRemaining,
        muscleStats,
        exercises,
        upgrades,
      } = prev;

      const clickMultiplier = upgrades.reduce(
        (mult, u) => mult * Math.pow(u.clickMultiplier, u.ownedCount),
        1.0
      );

      const pumpFactor = isPumpMode ? 3.0 : 1.0;
      const fatigueFactor = fatigue > 80 ? 0.7 : 1.0;

      const gainedExp = Math.round(
        currentExercise.baseExp *
          (1 + (currentExercise.level - 1) * 0.4) *
          clickMultiplier *
          pumpFactor *
          fatigueFactor
      );

      totalMuscleExp += gainedExp;
      lifetimeMuscleExp += gainedExp;
      totalReps += 1;

      const effectiveLoadKg =
        currentExercise.category === 'bodyweight'
          ? Math.round(prev.profile.weight * (currentExercise.currentWeight / 100))
          : currentExercise.currentWeight;
      totalLiftedKg += effectiveLoadKg;

      const newMuscleStats = { ...muscleStats };
      newMuscleStats[currentExercise.primaryMuscle] =
        Math.round((newMuscleStats[currentExercise.primaryMuscle] + 0.15) * 100) / 100;
      currentExercise.secondaryMuscles?.forEach((m) => {
        newMuscleStats[m] = Math.round((newMuscleStats[m] + 0.05) * 100) / 100;
      });

      if (!isPumpMode) {
        fatigue = Math.min(100, fatigue + 1.8);
      }

      if (!isPumpMode) {
        const creatineBonus = upgrades.find((u) => u.id === 'creatine')?.ownedCount || 0;
        const pumpIncrement = 7 * (1 + creatineBonus * 0.3);
        pumpGauge = Math.min(100, pumpGauge + pumpIncrement);

        if (pumpGauge >= 100) {
          isPumpMode = true;
          pumpTimeRemaining = 15;
          soundManager.playPumpMode();
          confetti({
            particleCount: 90,
            spread: 90,
            origin: { y: 0.5 },
          });
        }
      }

      const updatedExercises = exercises.map((item) =>
        item.id === currentExercise.id ? { ...item, repsCompleted: item.repsCompleted + 1 } : item
      );

      const newPlayerLevel = calculatePlayerLevel(lifetimeMuscleExp);

      let nextState: GameState = {
        ...prev,
        totalMuscleExp,
        lifetimeMuscleExp,
        playerLevel: newPlayerLevel,
        totalReps,
        totalLiftedKg,
        fatigue,
        pumpGauge,
        isPumpMode,
        pumpTimeRemaining,
        muscleStats: newMuscleStats,
        exercises: updatedExercises,
        lastSavedTimestamp: Date.now(),
      };

      const posX = clientX ?? window.innerWidth / 2 + (Math.random() * 80 - 40);
      const posY = clientY ?? window.innerHeight / 2 - 40;
      const newFloat: FloatingText = {
        id: floatingIdRef.current++,
        x: posX,
        y: posY,
        text: `+${gainedExp} EXP! 🔥`,
        color: isPumpMode ? '#f59e0b' : '#38bdf8',
      };
      setFloatingTexts((f) => [...f.slice(-12), newFloat]);
      setTimeout(() => {
        setFloatingTexts((f) => f.filter((item) => item.id !== newFloat.id));
      }, 800);

      nextState.exercises = checkExerciseUnlocks(nextState);
      nextState = checkAchievements(nextState);

      return nextState;
    });
  };

  // キーボード操作 (Space連打)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'SELECT'
        ) {
          return;
        }
        e.preventDefault();
        handlePerformRep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentExercise]);

  // 種目レベルアップ
  const handleUpgradeExercise = (exercise: Exercise) => {
    if (state.totalMuscleExp < exercise.upgradeCostExp) return;

    soundManager.playLevelUp();
    setState((prev) => {
      const newTotalExp = prev.totalMuscleExp - exercise.upgradeCostExp;
      const newLevel = exercise.level + 1;
      const nextCost = Math.round(exercise.upgradeCostExp * 1.6);

      const newWeight =
        exercise.category === 'gym'
          ? exercise.currentWeight + (exercise.id === 'bench_press' ? 5 : 2.5)
          : exercise.currentWeight;

      const updatedExercises = prev.exercises.map((item) =>
        item.id === exercise.id
          ? {
              ...item,
              level: newLevel,
              upgradeCostExp: nextCost,
              currentWeight: newWeight,
            }
          : item
      );

      let nextState: GameState = {
        ...prev,
        totalMuscleExp: newTotalExp,
        exercises: updatedExercises,
      };

      nextState.exercises = checkExerciseUnlocks(nextState);
      nextState = checkAchievements(nextState);

      return nextState;
    });
  };

  // ショップ購入
  const handleBuyUpgrade = (upgrade: UpgradeItem) => {
    const currentCost = Math.round(upgrade.cost * Math.pow(1.25, upgrade.ownedCount));
    if (state.totalMuscleExp < currentCost) return;

    soundManager.playPurchase();
    setState((prev) => {
      const newTotalExp = prev.totalMuscleExp - currentCost;
      const isGymCard = upgrade.id === 'gym_membership';

      const updatedUpgrades = prev.upgrades.map((item) =>
        item.id === upgrade.id ? { ...item, ownedCount: item.ownedCount + 1 } : item
      );

      let nextState: GameState = {
        ...prev,
        totalMuscleExp: newTotalExp,
        hasGymMembership: prev.hasGymMembership || isGymCard,
        upgrades: updatedUpgrades,
      };

      if (isGymCard) {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5 },
        });
      }

      nextState.exercises = checkExerciseUnlocks(nextState);
      nextState = checkAchievements(nextState);

      return nextState;
    });
  };

  // 休息・プロテイン回復
  const handleRest = () => {
    soundManager.playRecovery();
    setState((prev) => ({
      ...prev,
      fatigue: Math.max(0, prev.fatigue - 20),
    }));
  };

  const shakeCost = 30;
  const handleDrinkShake = () => {
    if (state.totalMuscleExp < shakeCost || state.fatigue <= 0) return;
    soundManager.playRecovery();
    setState((prev) => ({
      ...prev,
      totalMuscleExp: prev.totalMuscleExp - shakeCost,
      fatigue: 0,
    }));
  };

  // プロファイル保存
  const handleSaveProfile = (profile: UserProfile) => {
    const stats = estimateInitialStats(profile);
    setState((prev) => {
      const isFirst = !prev.profile.isInitialized;
      let nextState: GameState = {
        ...prev,
        profile,
        muscleStats: isFirst ? stats.muscleStats : prev.muscleStats,
      };
      nextState.exercises = checkExerciseUnlocks(nextState);
      return nextState;
    });
    setIsProfileOpen(false);
  };

  // リセット
  const handleResetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('pump_hero_game_state_v1');
    const fresh = createInitialGameState(defaultProfile);
    setState(fresh);
    setIsStatsOpen(false);
    setIsProfileOpen(true);
  };

  const totalPassiveExpPerSec = state.upgrades.reduce(
    (sum, u) => sum + u.passiveExpPerSec * u.ownedCount,
    0
  );

  const current1RM = calculateCurrent1RM(state);
  const big3Total = current1RM.benchPress + current1RM.squat + current1RM.deadlift;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden select-none">
      {/* 浮遊テキスト */}
      <FloatingNumbers floatingTexts={floatingTexts} />

      {/* ================= 上部 HUD (ゲーム風ステータスバー) ================= */}
      <header className="z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* プレイヤー情報 ＆ レベル */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/30">
              💪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-wider text-white font-display">
                  PUMP HERO <span className="text-cyan-400">3D</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-display">
                  Lv.{state.playerLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {state.profile.name} (BIG3推定: <strong className="text-amber-400">{big3Total}kg</strong>)
              </p>
            </div>
          </div>

          {/* 筋EXP ＆ 放置秒給 */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-2xl flex items-center gap-2">
              <span className="text-base animate-pulse">⚡</span>
              <div>
                <div className="text-[9px] text-slate-400 font-semibold">所持 筋EXP</div>
                <div className="text-sm font-black text-cyan-400 font-display">
                  {formatNumber(state.totalMuscleExp)}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-2xl hidden sm:flex items-center gap-2">
              <span className="text-base">⏳</span>
              <div>
                <div className="text-[9px] text-slate-400 font-semibold">自動放置育成</div>
                <div className="text-sm font-black text-emerald-400 font-display">
                  +{totalPassiveExpPerSec} /秒
                </div>
              </div>
            </div>

            {/* ナビゲーションアイコンボタン群 */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsShopOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-cyan-300 transition cursor-pointer flex items-center gap-1 shadow-sm"
                title="ショップ＆放置育成"
              >
                <span>💊</span>
                <span className="hidden md:inline">ショップ</span>
              </button>

              <button
                onClick={() => setIsAnatomyOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 transition cursor-pointer flex items-center gap-1 shadow-sm"
                title="筋肉アナトミー"
              >
                <span>🧬</span>
                <span className="hidden md:inline">筋肉部位</span>
              </button>

              <button
                onClick={() => setIsAchievementsOpen(true)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-400 transition cursor-pointer text-xs"
                title="実績"
              >
                🏆
              </button>

              <button
                onClick={() => setIsStatsOpen(true)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition cursor-pointer text-xs"
                title="成長カルテ"
              >
                📊
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition cursor-pointer text-xs"
                title="身体データ設定"
              >
                ⚙️
              </button>

              <button
                onClick={() => setIsMuted(soundManager.toggleMute())}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 transition cursor-pointer text-xs"
                title={isMuted ? 'ミュート解除' : 'ミュート'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= メイン 3D ゲームビューポート ＆ コントロール ================= */}
      <main className="max-w-7xl mx-auto px-4 py-3 w-full flex-1 flex flex-col space-y-3">
        {/* パンプ感ゲージ ＆ 疲労度バー */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* PUMP GAUGE */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 px-3.5 shadow-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-orange-400 tracking-wide flex items-center gap-1.5 uppercase font-display">
                <span className="animate-bounce">🔥</span>
                <span>{state.isPumpMode ? '✨ SUPER PUMP MODE 発動中！ ✨' : 'PUMP GAUGE (パンプ熱気)'}</span>
              </span>
              <span className="text-xs font-black font-display text-white">
                {state.isPumpMode
                  ? `${state.pumpTimeRemaining}秒 (EXP 3倍 / 疲労ゼロ)`
                  : `${Math.floor(state.pumpGauge)}%`}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  state.isPumpMode
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 animate-pulse shadow-lg shadow-orange-500/60'
                    : 'bg-gradient-to-r from-orange-600 to-amber-400'
                }`}
                style={{
                  width: state.isPumpMode
                    ? `${(state.pumpTimeRemaining / 15) * 100}%`
                    : `${state.pumpGauge}%`,
                }}
              />
            </div>
          </div>

          {/* FATIGUE & 疲労回復クイックボタン */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 px-3.5 shadow-xl flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <span>⚡</span>
                  <span>FATIGUE 疲労度</span>
                </span>
                <span
                  className={`font-black font-display ${
                    state.fatigue > 75 ? 'text-rose-400 animate-pulse' : 'text-slate-400'
                  }`}
                >
                  {Math.floor(state.fatigue)}% {state.fatigue > 75 && '(筋肉痛!)'}
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    state.fatigue > 75
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                  }`}
                  style={{ width: `${state.fatigue}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleRest}
                className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold border border-slate-700 transition cursor-pointer"
                title="深呼吸・休息"
              >
                🧘 休息
              </button>
              <button
                onClick={handleDrinkShake}
                disabled={state.totalMuscleExp < shakeCost || state.fatigue <= 0}
                className={`py-1 px-2.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                  state.totalMuscleExp >= shakeCost && state.fatigue > 0
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                    : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
                title="特濃プロテインで全快"
              >
                🥤 プロテイン ({shakeCost})
              </button>
            </div>
          </div>
        </div>

        {/* 3D 空間キャンバス */}
        <div className="relative w-full flex-1 min-h-[500px]">
          <ThreeGymCanvas
            currentExercise={currentExercise}
            muscleStats={state.muscleStats}
            isPumpMode={state.isPumpMode}
            fatigue={state.fatigue}
            repTrigger={repTrigger}
          />
        </div>

        {/* 巨大な「1 REP 挙上！」メインアクションボタン */}
        <div className="w-full max-w-xl mx-auto">
          <button
            onClick={(e) => handlePerformRep(e.clientX, e.clientY)}
            className={`w-full py-4 px-6 rounded-3xl font-black text-lg sm:text-xl text-white transition-all transform cursor-pointer flex items-center justify-center gap-3 select-none shadow-2xl active:scale-[0.96] border ${
              isPressingRep ? 'scale-[0.96] brightness-125' : 'hover:scale-[1.01]'
            } ${
              state.isPumpMode
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 border-amber-300 shadow-orange-500/40 animate-pulse'
                : currentExercise.category === 'gym'
                ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-orange-600 border-amber-500/40 shadow-amber-600/30'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 border-cyan-400/40 shadow-cyan-500/30'
            }`}
          >
            <span className="text-2xl">💪</span>
            <span className="tracking-wider">
              {currentExercise.name} 1 REP 挙上！
            </span>
            <span className="text-xs font-normal opacity-80 bg-black/30 px-2.5 py-1 rounded-full">
              [Spaceキー連打OK]
            </span>
          </button>
        </div>

        {/* 種目セレクトカルーセル */}
        <ExerciseCarousel
          exercises={state.exercises}
          currentExerciseId={currentExercise.id}
          onSelectExercise={setCurrentExerciseId}
          onUpgradeLevel={handleUpgradeExercise}
          availableExp={state.totalMuscleExp}
        />
      </main>

      {/* ================= モーダル群 ================= */}
      {/* ニュートリション＆施設ショップ モーダル */}
      {isShopOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl p-6 shadow-2xl text-slate-100 my-8">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setIsShopOpen(false)}
                className="text-slate-400 hover:text-white text-xl p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕ 閉じる
              </button>
            </div>
            <NutritionShop
              upgrades={state.upgrades}
              availableExp={state.totalMuscleExp}
              totalPassiveExpPerSec={totalPassiveExpPerSec}
              hasGymMembership={state.hasGymMembership}
              onBuyUpgrade={handleBuyUpgrade}
            />
          </div>
        </div>
      )}

      {/* 筋肉アナトミーマップ モーダル */}
      {isAnatomyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl p-6 shadow-2xl text-slate-100 my-8">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setIsAnatomyOpen(false)}
                className="text-slate-400 hover:text-white text-xl p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕ 閉じる
              </button>
            </div>
            <MuscleMap
              muscleStats={state.muscleStats}
              selectedMuscle={selectedMuscle}
              onSelectMuscle={setSelectedMuscle}
              isPumpMode={state.isPumpMode}
            />
          </div>
        </div>
      )}

      {/* 初回・身体測定プロファイル設定 */}
      <ProfileModal
        currentProfile={state.profile}
        isOpen={isProfileOpen}
        onSave={handleSaveProfile}
        onClose={() => setIsProfileOpen(false)}
        isFirstTime={!state.profile.isInitialized}
      />

      {/* 実績モーダル */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        achievements={state.achievements}
      />

      {/* 成長カルテ＆データリセット */}
      <WorkoutSummary
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        state={state}
        onResetGame={handleResetGame}
      />
    </div>
  );
};

export default App;
