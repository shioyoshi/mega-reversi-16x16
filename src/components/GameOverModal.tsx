import React from 'react';
import { PlayerColor, GameStats } from '../types/reversi';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100 text-center">
        <div className="text-5xl mb-3">
          {isDraw ? '🤝' : isBlackWin ? '⚫' : '⚪'}
        </div>

        <h2 className="text-2xl font-black font-display text-white mb-1">
          {isDraw
            ? '引き分け！ (DRAW)'
            : isBlackWin
            ? '黒 (BLACK) の勝利！ 🎉'
            : '白 (WHITE) の勝利！ 🎉'}
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          16×16盤面の激闘が決着しました！
        </p>

        {/* 最終スコア */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-5">
          <div className="text-xs font-bold text-slate-400 mb-3">最終結果</div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* 黒 */}
            <div
              className={`p-3 rounded-xl border ${
                isBlackWin
                  ? 'bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-500/20'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-300 mb-1">
                <span className="w-3 h-3 rounded-full bg-slate-950 border border-purple-400 inline-block" />
                <span>黒 (BLACK)</span>
              </div>
              <div className="text-2xl font-black font-display text-white">
                {stats.blackCount}{' '}
                <span className="text-xs font-normal text-slate-400">枚</span>
              </div>
              <div className="text-[10px] text-purple-400 mt-1">
                完成ブロック: {stats.blackBlocksCount} 個
              </div>
            </div>

            {/* 白 */}
            <div
              className={`p-3 rounded-xl border ${
                !isBlackWin && !isDraw
                  ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-cyan-300 mb-1">
                <span className="w-3 h-3 rounded-full bg-white border border-slate-300 inline-block" />
                <span>白 (WHITE)</span>
              </div>
              <div className="text-2xl font-black font-display text-white">
                {stats.whiteCount}{' '}
                <span className="text-xs font-normal text-slate-400">枚</span>
              </div>
              <div className="text-[10px] text-cyan-400 mt-1">
                完成ブロック: {stats.whiteBlocksCount} 個
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3.5 px-6 rounded-2xl font-black text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 shadow-xl shadow-cyan-500/25 active:scale-95 transition cursor-pointer text-sm"
        >
          もう一度対戦する 🔄
        </button>
      </div>
    </div>
  );
};
