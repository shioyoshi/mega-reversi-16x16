import React from 'react';
import { GameStats } from '../types/reversi';

interface GameOverModalProps {
  isOpen: boolean;
  stats: GameStats;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats,
  onRestart,
}) => {
  if (!isOpen) return null;

  const isDraw = stats.winner === 'draw';
  const isBlackWin = stats.winner === 'black';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-slate-100 text-center">
        <div className="text-3xl mb-2">
          {isDraw ? '🤝' : isBlackWin ? '⚫' : '⚪'}
        </div>

        <h2 className="text-xl font-bold font-display text-white mb-1">
          {isDraw
            ? '引き分け (Draw)'
            : isBlackWin
            ? '黒 (Black) の勝利！'
            : '白 (White) の勝利！'}
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          16×16盤面の対局が決着しました
        </p>

        {/* スコア比較カード */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5">
          <div className="grid grid-cols-2 gap-3">
            {/* 黒 */}
            <div
              className={`p-3 rounded-lg border ${
                isBlackWin
                  ? 'bg-slate-900 border-amber-400/80 ring-1 ring-amber-400/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1a1c23] border border-[#374151] inline-block" />
                <span>黒</span>
              </div>
              <div className="text-2xl font-bold font-display text-white">
                {stats.blackCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                2×2完成: {stats.blackBlocksCount}
              </div>
            </div>

            {/* 白 */}
            <div
              className={`p-3 rounded-lg border ${
                !isBlackWin && !isDraw
                  ? 'bg-slate-900 border-cyan-400/80 ring-1 ring-cyan-400/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f8fafc] border border-[#cbd5e1] inline-block" />
                <span>白</span>
              </div>
              <div className="text-2xl font-bold font-display text-white">
                {stats.whiteCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                2×2完成: {stats.whiteBlocksCount}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] transition cursor-pointer text-xs shadow-md shadow-amber-400/20"
        >
          もう一度対戦する
        </button>
      </div>
    </div>
  );
};
