import React from 'react';
import { GameState } from '../types/game';
import { calculatePlayerLevel, getExpForNextLevel, calculateCurrent1RM, formatNumber, formatTonnage } from '../utils/calc';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  state: GameState;
  onOpenProfile: () => void;
  onOpenAchievements: () => void;
  onOpenStats: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onOpenProfile,
  onOpenAchievements,
  onOpenStats,
  isMuted,
  onToggleMute,
}) => {
  const currentLevel = calculatePlayerLevel(state.lifetimeMuscleExp);
  const nextLevelExp = getExpForNextLevel(currentLevel);
  const prevLevelExp = getExpForNextLevel(currentLevel - 1);
  const expProgress =
    nextLevelExp > prevLevelExp
      ? Math.min(100, Math.max(0, ((state.lifetimeMuscleExp - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100))
      : 0;

  const current1RM = calculateCurrent1RM(state);
  const big3Total = current1RM.benchPress + current1RM.squat + current1RM.deadlift;

  const unlockedAchievementsCount = state.achievements.filter((a) => a.unlocked).length;

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* タイトル ＆ レベル */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/25">
              💪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wider text-white font-display">
                  PUMP HERO
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm font-display">
                  Lv.{currentLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {state.profile.name} ({state.profile.height}cm / {state.profile.weight}kg)
              </p>
            </div>
          </div>

          {/* モバイル用クイック操作 */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-sm"
              title="サウンドON/OFF"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={onOpenAchievements}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 text-sm relative"
              title="実績"
            >
              🏆
              {unlockedAchievementsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {unlockedAchievementsCount}
                </span>
              )}
            </button>
            <button
              onClick={onOpenProfile}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-sm"
              title="身体データ設定"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* 主要ステータス表示 (EXP, BIG3, トン数) */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {/* 現在の所持EXP (プロテインポイント) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <div className="text-[10px] text-slate-400">所持 筋EXP</div>
              <div className="text-sm font-extrabold text-cyan-400 font-display">
                {formatNumber(state.totalMuscleExp)}
              </div>
            </div>
          </div>

          {/* 推定BIG3合計 */}
          <div
            onClick={onOpenStats}
            className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 cursor-pointer transition"
          >
            <span className="text-base">🏋️</span>
            <div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>推定 BIG3 合計</span>
                <span className="text-[9px] text-cyan-400">詳細 ↗</span>
              </div>
              <div className="text-sm font-extrabold text-amber-400 font-display">
                {big3Total} <span className="text-[10px] font-normal text-slate-400">kg</span>
              </div>
            </div>
          </div>

          {/* 累計挙上重量 (トン数) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 hidden sm:flex items-center gap-2">
            <span className="text-base">🚚</span>
            <div>
              <div className="text-[10px] text-slate-400">総挙上重量</div>
              <div className="text-sm font-extrabold text-emerald-400 font-display">
                {formatTonnage(state.totalLiftedKg)}
              </div>
            </div>
          </div>

          {/* デスクトップ用コントロールボタン */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 transition cursor-pointer"
              title={isMuted ? 'ミュート解除' : 'ミュート'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={onOpenAchievements}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative"
            >
              <span>🏆</span>
              <span>実績</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full border border-amber-500/40">
                {unlockedAchievementsCount}/{state.achievements.length}
              </span>
            </button>
            <button
              onClick={onOpenProfile}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚙️</span>
              <span>身体設定</span>
            </button>
          </div>
        </div>
      </div>

      {/* レベル進行度プログレスバー */}
      <div className="max-w-7xl mx-auto mt-2">
        <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${expProgress}%` }}
          />
        </div>
      </div>
    </header>
  );
};
