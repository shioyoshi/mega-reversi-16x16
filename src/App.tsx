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
} from './data/initialData';
import {
  calculatePlayerLevel,
  estimateInitialStats,
  calculateCurrent1RM,
} from './utils/calc';
import { soundManager } from './utils/audio';

import { Header } from './components/Header';
import { ProfileModal } from './components/ProfileModal';
import { MuscleMap } from './components/MuscleMap';
import { PumpBar } from './components/PumpBar';
import { ExerciseCard } from './components/ExerciseCard';
import { NutritionShop } from './components/NutritionShop';
import { AchievementsModal } from './components/AchievementsModal';
import { WorkoutSummary } from './components/WorkoutSummary';
import { FloatingNumbers } from './components/FloatingNumbers';

const STORAGE_KEY = 'pump_hero_game_state_v1';

export const App: React.FC = () => {
  // ゲームステートのロード
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 新規項目等の補完
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
    return createInitialGameState(defaultProfile);
  });

  // UIモーダル制御
  const [isProfileOpen, setIsProfileOpen] = useState(!state.profile.isInitialized);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  // フィルター＆タブ
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'bodyweight' | 'gym'>('all');
  const [activeTab, setActiveTab] = useState<'exercises' | 'shop'>('exercises');

  // 浮遊エフェクト
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const floatingIdRef = useRef(0);

  // ステートの自動保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // 実績チェック
  const checkAchievements = (currentState: GameState) => {
    let newlyUnlocked = false;
    const updatedAchievements = currentState.achievements.map((ach) => {
      if (!ach.unlocked && ach.check(currentState)) {
        newlyUnlocked = true;
        soundManager.playLevelUp();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
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
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
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

        // 放置EXP計算
        const passivePerSec = upgrades.reduce(
          (sum, u) => sum + u.passiveExpPerSec * u.ownedCount,
          0
        );

        if (passivePerSec > 0) {
          totalMuscleExp += passivePerSec;
          lifetimeMuscleExp += passivePerSec;
        }

        // 自然疲労回復 (毎秒少しずつ回復)
        const recoveryRate = upgrades.reduce(
          (mult, u) => mult * Math.pow(u.fatigueRecoveryMultiplier, u.ownedCount),
          1.0
        );
        fatigue = Math.max(0, fatigue - 0.5 * recoveryRate);

        // 超パンプモードのカウントダウン
        if (isPumpMode) {
          pumpTimeRemaining -= 1;
          if (pumpTimeRemaining <= 0) {
            isPumpMode = false;
            pumpTimeRemaining = 0;
            pumpGauge = 0;
          }
        } else {
          // 通常時は放置するとパンプ感は徐々に減少
          pumpGauge = Math.max(0, pumpGauge - 0.4);
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

        // アンロック＆実績判定
        nextState.exercises = checkExerciseUnlocks(nextState);
        nextState = checkAchievements(nextState);

        return nextState;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 1レップ実行
  const handlePerformRep = (exercise: Exercise, e: React.MouseEvent<HTMLButtonElement>) => {
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

      // クリック倍率の計算
      const clickMultiplier = upgrades.reduce(
        (mult, u) => mult * Math.pow(u.clickMultiplier, u.ownedCount),
        1.0
      );

      const pumpFactor = isPumpMode ? 3.0 : 1.0;
      const fatigueFactor = fatigue > 80 ? 0.7 : 1.0;

      const gainedExp = Math.round(
        exercise.baseExp * (1 + (exercise.level - 1) * 0.4) * clickMultiplier * pumpFactor * fatigueFactor
      );

      totalMuscleExp += gainedExp;
      lifetimeMuscleExp += gainedExp;
      totalReps += 1;

      // 挙上負荷重量
      const effectiveLoadKg =
        exercise.category === 'bodyweight'
          ? Math.round(prev.profile.weight * (exercise.currentWeight / 100))
          : exercise.currentWeight;
      totalLiftedKg += effectiveLoadKg;

      // 部位筋力の微小成長 (主要部位+0.15, 副次部位+0.05)
      const newMuscleStats = { ...muscleStats };
      newMuscleStats[exercise.primaryMuscle] = Math.round((newMuscleStats[exercise.primaryMuscle] + 0.15) * 100) / 100;
      exercise.secondaryMuscles?.forEach((m) => {
        newMuscleStats[m] = Math.round((newMuscleStats[m] + 0.05) * 100) / 100;
      });

      // 疲労度蓄積 (パンプモード中は疲労ゼロ！)
      if (!isPumpMode) {
        fatigue = Math.min(100, fatigue + 1.8);
      }

      // パンプゲージの上昇
      if (!isPumpMode) {
        const creatineBonus = upgrades.find((u) => u.id === 'creatine')?.ownedCount || 0;
        const pumpIncrement = 6 * (1 + creatineBonus * 0.3);
        pumpGauge = Math.min(100, pumpGauge + pumpIncrement);

        if (pumpGauge >= 100) {
          isPumpMode = true;
          pumpTimeRemaining = 15;
          soundManager.playPumpMode();
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
          });
        }
      }

      // レップ数の記録
      const updatedExercises = exercises.map((item) =>
        item.id === exercise.id ? { ...item, repsCompleted: item.repsCompleted + 1 } : item
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

      // 浮遊テキストの追加
      const rect = e.currentTarget.getBoundingClientRect();
      const newFloat: FloatingText = {
        id: floatingIdRef.current++,
        x: rect.left + rect.width / 2 - 20 + (Math.random() * 40 - 20),
        y: rect.top - 10,
        text: `+${gainedExp} EXP! 💪`,
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

  // 種目レベルアップ
  const handleUpgradeExercise = (exercise: Exercise) => {
    if (state.totalMuscleExp < exercise.upgradeCostExp) return;

    setState((prev) => {
      const newTotalExp = prev.totalMuscleExp - exercise.upgradeCostExp;
      const newLevel = exercise.level + 1;
      const nextCost = Math.round(exercise.upgradeCostExp * 1.6);

      // ジム種目なら重量も少しUP
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

  // サプリメント・ギア・施設購入
  const handleBuyUpgrade = (upgrade: UpgradeItem) => {
    const currentCost = Math.round(upgrade.cost * Math.pow(1.25, upgrade.ownedCount));
    if (state.totalMuscleExp < currentCost) return;

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

  // 休息（疲労回復）
  const handleRest = () => {
    setState((prev) => ({
      ...prev,
      fatigue: Math.max(0, prev.fatigue - 20),
    }));
  };

  // プロテイン摂取（全快）
  const shakeCost = 30;
  const handleDrinkShake = () => {
    if (state.totalMuscleExp < shakeCost || state.fatigue <= 0) return;
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

  // ゲームデータのリセット
  const handleResetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = createInitialGameState(defaultProfile);
    setState(fresh);
    setIsStatsOpen(false);
    setIsProfileOpen(true);
  };

  // 絞り込み後の種目リスト
  const filteredExercises = state.exercises.filter((ex) => {
    if (categoryFilter !== 'all' && ex.category !== categoryFilter) return false;
    if (selectedMuscle && ex.primaryMuscle !== selectedMuscle && !ex.secondaryMuscles?.includes(selectedMuscle)) {
      return false;
    }
    return true;
  });

  const totalPassiveExpPerSec = state.upgrades.reduce(
    (sum, u) => sum + u.passiveExpPerSec * u.ownedCount,
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      {/* 浮遊エフェクト */}
      <FloatingNumbers floatingTexts={floatingTexts} />

      {/* ヘッダー */}
      <Header
        state={state}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(soundManager.toggleMute())}
      />

      {/* メインコンテナ */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 space-y-6">
        {/* パンプ感＆疲労度コントロール */}
        <PumpBar
          pumpGauge={state.pumpGauge}
          isPumpMode={state.isPumpMode}
          pumpTimeRemaining={state.pumpTimeRemaining}
          fatigue={state.fatigue}
          onRest={handleRest}
          onDrinkShake={handleDrinkShake}
          canAffordShake={state.totalMuscleExp >= shakeCost}
          shakeCost={shakeCost}
        />

        {/* 2カラムレイアウト: マッスルマップ ＆ 種目/ショップ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左カラム: アナトミーマップ (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <MuscleMap
              muscleStats={state.muscleStats}
              selectedMuscle={selectedMuscle}
              onSelectMuscle={setSelectedMuscle}
              isPumpMode={state.isPumpMode}
            />

            {/* クイックガイダンスカード */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>💡</span>
                <span>トレーナーからの助言</span>
              </div>
              <p>
                「まずは<strong className="text-cyan-400">腕立て・腹筋・スクワット</strong>の基本3種目をこなそう！
                種目レベルを上げると新しい自重トレや、やがて<strong className="text-amber-400">ジム会員権</strong>でベンチプレスなどの高重量種目が解放されるぞ！」
              </p>
            </div>
          </div>

          {/* 右カラム: 種目一覧 または ショップ (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* メインタブ切り替え (ワークアウト / ショップ) */}
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('exercises')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'exercises'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🏋️</span>
                <span>ワークアウト種目 ({state.exercises.filter((e) => e.unlocked).length}/{state.exercises.length} 解放)</span>
              </button>
              <button
                onClick={() => setActiveTab('shop')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'shop'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>💊</span>
                <span>ショップ＆放置育成 (+{totalPassiveExpPerSec} EXP/秒)</span>
              </button>
            </div>

            {/* 種目タブのとき */}
            {activeTab === 'exercises' && (
              <div className="space-y-4">
                {/* フィルターバー */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-semibold">カテゴリ:</span>
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setCategoryFilter('all')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                          categoryFilter === 'all'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        すべて
                      </button>
                      <button
                        onClick={() => setCategoryFilter('bodyweight')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                          categoryFilter === 'bodyweight'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        自重トレ
                      </button>
                      <button
                        onClick={() => setCategoryFilter('gym')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                          categoryFilter === 'gym'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ジム種目
                      </button>
                    </div>
                  </div>

                  {selectedMuscle && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cyan-400 font-bold">
                        部位絞り込み中
                      </span>
                      <button
                        onClick={() => setSelectedMuscle(null)}
                        className="text-[11px] text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
                      >
                        リセット
                      </button>
                    </div>
                  )}
                </div>

                {/* 種目カードグリッド */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      userWeight={state.profile.weight}
                      availableExp={state.totalMuscleExp}
                      isPumpMode={state.isPumpMode}
                      fatigue={state.fatigue}
                      onPerformRep={handlePerformRep}
                      onUpgradeLevel={handleUpgradeExercise}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ショップタブのとき */}
            {activeTab === 'shop' && (
              <NutritionShop
                upgrades={state.upgrades}
                availableExp={state.totalMuscleExp}
                totalPassiveExpPerSec={totalPassiveExpPerSec}
                hasGymMembership={state.hasGymMembership}
                onBuyUpgrade={handleBuyUpgrade}
              />
            )}
          </div>
        </div>
      </main>

      {/* モーダル群 */}
      <ProfileModal
        currentProfile={state.profile}
        isOpen={isProfileOpen}
        onSave={handleSaveProfile}
        onClose={() => setIsProfileOpen(false)}
        isFirstTime={!state.profile.isInitialized}
      />

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        achievements={state.achievements}
      />

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
