import React from 'react';
import { GameMode, GameStats } from '../types/reversi';

interface GameScoreHeaderProps {
  stats: GameStats;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onUndo: () => void;
  canUndo: boolean;
  onOpenRules: () => void;
  isAiThinking: boolean;
  message?: string | null;
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
  onOpenRules,
  isAiThinking,
  message,
}) => {
  return (
    <header className="w-full max-w-[640px] mx-auto pt-3 pb-1 px-2 space-y-2">
      {/* 上部: タイトルと厳選された最小限のコントロール */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base sm:text-lg font-bold text-white tracking-wider flex items-center gap-2">
          <span>16×16 REVERSI</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            特別ルール
          </span>
        </h1>

        <div className="flex items-center gap-2 text-xs">
          {/* モード切替 */}
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as GameMode)}
            className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 focus:outline-none focus:border-neutral-500 cursor-pointer"
          >
            {(Object.keys(modeLabels) as GameMode[]).map((k) => (
              <option key={k} value={k}>
                {modeLabels[k]}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenRules}
            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-medium transition cursor-pointer"
          >
            ルール
          </button>

          <button
            onClick={onUndo}
            disabled={!canUndo || isAiThinking}
            className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
              canUndo && !isAiThinking
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                : 'bg-neutral-900/40 text-neutral-600 border-neutral-800 cursor-not-allowed'
            }`}
          >
            待った
          </button>
        </div>
      </div>

      {/* スコア表示ボード (洗練された白・黒・灰色モノトーン) */}
      <div className="grid grid-cols-2 gap-3">
        {/* 黒プレイヤー */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            stats.turn === 'black'
              ? 'bg-neutral-900 border-white ring-1 ring-white/40 shadow-lg'
              : 'bg-neutral-950 border-neutral-800 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-black border border-neutral-600 shadow-sm shrink-0" />
              <span className="text-xs font-bold text-neutral-200">黒 (BLACK)</span>
            </div>
            {stats.turn === 'black' && (
              <span className="text-[10px] font-bold text-black bg-white px-1.5 py-0.5 rounded shadow-sm">
                {isAiThinking ? '思考中...' : '手番'}
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black font-display text-white">
              {stats.blackCount}
            </span>
            <span className="text-[11px] text-neutral-400">
              2×2完成: <strong className="text-white font-bold">{stats.blackBlocksCount}</strong>
            </span>
          </div>
        </div>

        {/* 白プレイヤー */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            stats.turn === 'white'
              ? 'bg-neutral-900 border-white ring-1 ring-white/40 shadow-lg'
              : 'bg-neutral-950 border-neutral-800 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white border border-neutral-300 shadow-sm shrink-0" />
              <span className="text-xs font-bold text-neutral-200">白 (WHITE)</span>
            </div>
            {stats.turn === 'white' && (
              <span className="text-[10px] font-bold text-black bg-white px-1.5 py-0.5 rounded shadow-sm">
                {isAiThinking ? '思考中...' : '手番'}
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black font-display text-white">
              {stats.whiteCount}
            </span>
            <span className="text-[11px] text-neutral-400">
              2×2完成: <strong className="text-white font-bold">{stats.whiteBlocksCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ステータス / パス・通知代替表示エリア (固定高h-8でレイアウトシフト・盤面移動を完全ゼロ化) */}
      <div className="h-8 flex items-center justify-center">
        {message ? (
          <div className="w-full bg-neutral-900 text-white border border-neutral-700 font-bold px-3 py-1 rounded-lg text-center text-xs shadow-md animate-in fade-in duration-100">
            {message}
          </div>
        ) : (
          <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                stats.turn === 'black'
                  ? 'bg-neutral-200 shadow-[0_0_6px_rgba(255,255,255,0.6)]'
                  : 'bg-neutral-400'
              }`}
            />
            <span>
              {stats.turn === 'black'
                ? '黒の手番です'
                : mode === 'pvp'
                ? '白の手番です'
                : '白(CPU)の手番です'}
              {isAiThinking && ' (思考中...)'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
