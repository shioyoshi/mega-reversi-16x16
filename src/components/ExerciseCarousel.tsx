import React from 'react';
import { Exercise } from '../types/game';

interface ExerciseCarouselProps {
  exercises: Exercise[];
  currentExerciseId: string;
  onSelectExercise: (id: string) => void;
  onUpgradeLevel: (exercise: Exercise) => void;
  availableExp: number;
}

export const ExerciseCarousel: React.FC<ExerciseCarouselProps> = ({
  exercises,
  currentExerciseId,
  onSelectExercise,
  onUpgradeLevel,
  availableExp,
}) => {
  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl p-3 shadow-2xl">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>🏋️‍♂️</span>
          <span>種目セレクト（クリックで即時セットアップ）</span>
        </span>
        <span className="text-[11px] text-cyan-400 font-semibold">
          開放中: {exercises.filter((e) => e.unlocked).length} / {exercises.length} 種目
        </span>
      </div>

      {/* 横スクロールリスト */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin px-1">
        {exercises.map((ex) => {
          const isSelected = ex.id === currentExerciseId;
          const canUpgrade = ex.unlocked && availableExp >= ex.upgradeCostExp;

          if (!ex.unlocked) {
            return (
              <div
                key={ex.id}
                className="shrink-0 w-44 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 opacity-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                    <span className="line-clamp-1">{ex.name}</span>
                    <span>🔒</span>
                  </div>
                  <div className="text-[10px] text-amber-500 line-clamp-2 mt-1">
                    {ex.unlockConditionText}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={ex.id}
              className={`shrink-0 w-52 rounded-2xl p-3 transition-all flex flex-col justify-between cursor-pointer border ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => onSelectExercise(ex.id)}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <h4
                    className={`text-xs font-bold font-display line-clamp-1 ${
                      isSelected ? 'text-cyan-300' : 'text-white'
                    }`}
                  >
                    {ex.name}
                  </h4>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                      ex.category === 'gym'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {ex.category === 'gym' ? 'ジム' : '自重'}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 flex justify-between items-center my-1.5">
                  <span>Lv.{ex.level}</span>
                  <span className="text-amber-400 font-display font-bold">
                    +{ex.baseExp} EXP
                  </span>
                  <span className="text-slate-500 font-display">
                    {ex.repsCompleted} 回
                  </span>
                </div>
              </div>

              {/* フォーム改善・レベルアップボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpgradeLevel(ex);
                }}
                disabled={!canUpgrade}
                className={`w-full mt-2 py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-between cursor-pointer ${
                  canUpgrade
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 active:scale-95'
                    : 'bg-slate-900/60 text-slate-600 border border-slate-800/80 cursor-not-allowed'
                }`}
              >
                <span>LvUP フォーム改善</span>
                <span className="font-display font-black">
                  {ex.upgradeCostExp.toLocaleString()}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
