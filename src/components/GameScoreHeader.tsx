import React from 'react';
import { GameMode, GameStats } from '../types/reversi';

interface GameScoreHeaderProps {
  stats: GameStats;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onUndo: () => void;
  canUndo: boolean;
  onRestart: () => void;
  onOpenRules: () => void;
  showHints: boolean;
  onToggleHints: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isAiThinking: boolean;
}

const modeLabels: Record<GameMode, string> = {
  pvp: '2人対戦',
  ai_easy: 'CPU (かんたん)',
  ai_medium: 'CPU (ふつう)',
  ai_hard: 'CPU (つよい)',
};

export const GameScoreHeader: React.FC<GameScoreHeaderProps> = ({
  stats,
  mode,
  onModeChange,
  onUndo,
  canUndo,
  onRestart,
  onOpenRules,
  showHints,
  onToggleHints,
  isMuted,
  onToggleMute,
  isAiThinking,
}) => {
  return (
    <header className="w-full max-w-[640px] mx-auto pt-3 pb-2 px-2 space-y-2.5">
      {/* タイトルとコントロールメニュー */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
          <span>オセロ 16×16</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-800 text-emerald-100 border border-emerald-600/50">
            特別ルール
          </span>
        </h1>

        <div className="flex items-center gap-1.5 text-xs">
          {/* モード切替 */}
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as GameMode)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none cursor-pointer"
          >
            {(Object.keys(modeLabels) as GameMode[]).map((k) => (
              <option key={k} value={k}>
                {modeLabels[k]}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenRules}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium transition cursor-pointer"
          >
            ルール
          </button>

          <button
            onClick={onUndo}
            disabled={!canUndo || isAiThinking}
            className={`px-2 py-1 rounded-lg border font-medium transition cursor-pointer ${
              canUndo && !isAiThinking
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
          >
            待った
          </button>

          <button
            onClick={onToggleHints}
            className={`px-2 py-1 rounded-lg border font-medium transition cursor-pointer ${
              showHints
                ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            ヒント
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
            title={isMuted ? 'ミュート解除' : 'ミュート'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={onRestart}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
            title="リセット"
          >
            🔄
          </button>
        </div>
      </div>

      {/* スコア表示ボード (画像のようなオセロ石とスコア) */}
      <div className="grid grid-cols-2 gap-3">
        {/* 黒プレイヤー */}
        <div
          className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition-all ${
            stats.turn === 'black'
              ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#2a2a2a] via-[#151515] to-[#050505] shadow border border-[#333] shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>黒</span>
                {stats.turn === 'black' && (
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1 rounded font-bold">
                    {isAiThinking ? '思考中...' : '手番'}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                2×2完成: <strong className="text-amber-400">{stats.blackBlocksCount}</strong>
              </div>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-display text-white">
            {stats.blackCount}
          </div>
        </div>

        {/* 白プレイヤー */}
        <div
          className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition-all ${
            stats.turn === 'white'
              ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-400/30'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#ffffff] via-[#f4f4f4] to-[#dedede] shadow border border-[#d0d0d0] shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>白</span>
                {stats.turn === 'white' && (
                  <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1 rounded font-bold">
                    {isAiThinking ? '思考中...' : '手番'}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                2×2完成: <strong className="text-cyan-400">{stats.whiteBlocksCount}</strong>
              </div>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-display text-white">
            {stats.whiteCount}
          </div>
        </div>
      </div>
    </header>
  );
};
