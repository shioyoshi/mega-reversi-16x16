import React, { useState } from 'react';
import { Exercise, MuscleGroup } from '../types/game';
import { soundManager } from '../utils/audio';

interface ExerciseCardProps {
  exercise: Exercise;
  userWeight: number;
  availableExp: number;
  isPumpMode: boolean;
  fatigue: number;
  onPerformRep: (exercise: Exercise, e: React.MouseEvent<HTMLButtonElement>) => void;
  onUpgradeLevel: (exercise: Exercise) => void;
}

const muscleLabels: Record<MuscleGroup, string> = {
  chest: '大胸筋',
  back: '背中・広背筋',
  legs: '脚・下半身',
  core: '腹筋・体幹',
  arms: '腕・上腕',
  shoulders: '肩・三角筋',
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  userWeight,
  availableExp,
  isPumpMode,
  fatigue,
  onPerformRep,
  onUpgradeLevel,
}) => {
  const [isPressing, setIsPressing] = useState(false);

  // 1レップあたりの実質負荷重量の計算
  const effectiveLoadKg =
    exercise.category === 'bodyweight'
      ? Math.round(userWeight * (exercise.currentWeight / 100))
      : exercise.currentWeight;

  // 疲労度による獲得倍率 (疲労80%超えで若干低下)
  const fatigueFactor = fatigue > 80 ? 0.7 : 1.0;
  const pumpFactor = isPumpMode ? 3.0 : 1.0;
  const estimatedGain = Math.round(
    exercise.baseExp * (1 + (exercise.level - 1) * 0.4) * pumpFactor * fatigueFactor
  );

  const canAffordUpgrade = availableExp >= exercise.upgradeCostExp;

  if (!exercise.unlocked) {
    return (
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between opacity-60 backdrop-blur-sm relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <h4 className="font-bold text-slate-400 text-sm">{exercise.name}</h4>
            </div>
            <p className="text-[11px] text-slate-500 font-display">{exercise.nameEn}</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500">
            {exercise.category === 'bodyweight' ? '自重トレ' : 'ジム種目'}
          </span>
        </div>

        <div className="my-4 py-3 px-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] text-amber-500 font-semibold mb-1">【開放条件】</div>
          <div className="text-xs text-slate-300 font-bold">{exercise.unlockConditionText}</div>
        </div>

        <div className="text-[10px] text-slate-500 line-clamp-2">{exercise.description}</div>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all duration-200 relative overflow-hidden ${
        isPumpMode
          ? 'border-orange-500/50 shadow-orange-500/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* 上部ヘッダー */}
      <div>
        <div className="flex justify-between items-start gap-2 mb-1">
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-white text-base font-display">{exercise.name}</h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Lv.{exercise.level}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-display">{exercise.nameEn}</p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                exercise.category === 'bodyweight'
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              {exercise.category === 'bodyweight' ? '自重トレ' : 'ジム・ウエイト'}
            </span>
            <span className="text-[10px] text-slate-400">
              主要: <strong className="text-slate-300">{muscleLabels[exercise.primaryMuscle]}</strong>
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 my-2 line-clamp-2 leading-relaxed">
          {exercise.description}
        </p>
      </div>

      {/* ステータスバー */}
      <div className="bg-slate-950/80 rounded-xl p-2.5 my-2 border border-slate-800/80 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[10px] text-slate-500">挙上負荷重量</div>
          <div className="text-xs font-bold text-cyan-400 font-display">
            {effectiveLoadKg} kg
            {exercise.category === 'bodyweight' && (
              <span className="text-[9px] text-slate-500 block font-normal">
                (体重の{exercise.currentWeight}%)
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">獲得筋肥大</div>
          <div className="text-xs font-bold text-amber-400 font-display">
            +{estimatedGain} EXP
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">累計レップ数</div>
          <div className="text-xs font-bold text-emerald-400 font-display">
            {exercise.repsCompleted.toLocaleString()} 回
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="space-y-2 mt-1">
        {/* レップ挙上ボタン */}
        <button
          onClick={(e) => {
            soundManager.playRep(exercise.category === 'gym');
            setIsPressing(true);
            setTimeout(() => setIsPressing(false), 120);
            onPerformRep(exercise, e);
          }}
          className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all transform cursor-pointer flex items-center justify-center gap-2 select-none shadow-md ${
            isPressing ? 'scale-[0.96] brightness-125' : 'hover:scale-[1.01]'
          } ${
            isPumpMode
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/30'
              : exercise.category === 'bodyweight'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-600/25 hover:from-cyan-500 hover:to-blue-500'
              : 'bg-gradient-to-r from-amber-600 to-rose-600 shadow-amber-600/25 hover:from-amber-500 hover:to-rose-500'
          }`}
        >
          <span className="text-base">💪</span>
          <span className="text-sm tracking-wide">
            1 REP 挙上！ (+{estimatedGain} EXP)
          </span>
        </button>

        {/* フォーム改善・レベルアップボタン */}
        <button
          onClick={() => {
            soundManager.playLevelUp();
            onUpgradeLevel(exercise);
          }}
          disabled={!canAffordUpgrade}
          className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-between ${
            canAffordUpgrade
              ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30 shadow-sm'
              : 'bg-slate-950/40 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
        >
          <span>🎯 フォーム改善＆負荷UP (Lv.{exercise.level + 1})</span>
          <span className="font-display font-bold">
            {exercise.upgradeCostExp.toLocaleString()} EXP
          </span>
        </button>
      </div>
    </div>
  );
};
