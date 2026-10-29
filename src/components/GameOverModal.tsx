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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-neutral-100 text-center">
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
        <p className="text-xs text-neutral-400 mb-5">
          16×16盤面の対局が決着しました
        </p>

        {/* スコア比較カード (モノトーン) */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 mb-5">
          <div className="grid grid-cols-2 gap-3">
            {/* 黒 */}
            <div
              className={`p-3 rounded-lg border ${
                isBlackWin
                  ? 'bg-neutral-900 border-white ring-1 ring-white/40'
                  : 'bg-neutral-900/60 border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-300 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-black border border-neutral-500 inline-block" />
                <span>黒</span>
              </div>
              <div className="text-2xl font-bold font-display text-white">
                {stats.blackCount}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                2×2完成: <strong className="text-white">{stats.blackBlocksCount}</strong>
              </div>
            </div>

            {/* 白 */}
            <div
              className={`p-3 rounded-lg border ${
                !isBlackWin && !isDraw
                  ? 'bg-neutral-900 border-white ring-1 ring-white/40'
                  : 'bg-neutral-900/60 border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-300 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-neutral-400 inline-block" />
                <span>白</span>
              </div>
              <div className="text-2xl font-bold font-display text-white">
                {stats.whiteCount}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                2×2完成: <strong className="text-white">{stats.whiteBlocksCount}</strong>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3 px-4 rounded-xl font-bold text-black bg-white hover:bg-neutral-200 active:scale-[0.99] transition cursor-pointer text-xs shadow-md"
        >
          もう一度対戦する
        </button>
      </div>
    </div>
  );
};
