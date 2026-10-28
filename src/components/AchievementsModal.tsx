import React from 'react';
import { Achievement } from '../types/game';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements,
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercent = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-slate-100 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="text-xl font-bold font-display text-white">マッスル・実績トロフィー</h2>
              <p className="text-xs text-slate-400">
                トレーニングの節目を達成して称号を獲得しよう
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 達成率バー */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-slate-400 font-semibold">実績達成率</span>
            <span className="text-sm font-extrabold text-amber-400 font-display">
              {unlockedCount} / {achievements.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* リスト */}
        <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3.5 rounded-xl border flex items-center gap-3.5 transition ${
                ach.unlocked
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-60'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                  ach.unlocked
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-600'
                }`}
              >
                {ach.unlocked ? ach.icon : '🔒'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4
                    className={`font-bold text-sm ${
                      ach.unlocked ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {ach.title}
                  </h4>
                  {ach.unlocked && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      達成済
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{ach.description}</p>
                {ach.unlocked && ach.unlockedAt && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    解除日: {new Date(ach.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
