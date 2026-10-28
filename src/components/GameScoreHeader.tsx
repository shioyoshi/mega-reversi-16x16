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
    <header className="w-full max-w-[620px] mx-auto pt-4 pb-2 px-1 space-y-3">
      {/* 上部: タイトル ＆ 操作ボタングループ */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>16×16 REVERSI</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              特別ルール
            </span>
          </h1>
        </div>

        {/* コントロールアイコン群 */}
        <div className="flex items-center gap-1.5">
          {/* モード選択ドロップダウン */}
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as GameMode)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-slate-500 cursor-pointer"
          >
            {(Object.keys(modeLabels) as GameMode[]).map((k) => (
              <option key={k} value={k}>
                {modeLabels[k]}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenRules}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition cursor-pointer"
            title="特別ルールの説明"
          >
            ルール
          </button>

          <button
            onClick={onUndo}
            disabled={!canUndo || isAiThinking}
            className={`px-2 py-1 rounded-lg border text-xs transition cursor-pointer ${
              canUndo && !isAiThinking
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
            title="1手戻す"
          >
            待った
          </button>

          <button
            onClick={onToggleHints}
            className={`px-2 py-1 rounded-lg border text-xs transition cursor-pointer ${
              showHints
                ? 'bg-slate-800 text-amber-300 border-slate-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="ヒント表示切替"
          >
            {showHints ? 'ヒントON' : 'ヒントOFF'}
          </button>

          <button
            onClick={onToggleMute}
            className="p-1 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
            title={isMuted ? 'ミュート解除' : 'ミュート'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={onRestart}
            className="p-1 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
            title="対局リセット"
          >
            🔄
          </button>
        </div>
      </div>

      {/* スコア ＆ ターン表示カード */}
      <div className="grid grid-cols-2 gap-3">
        {/* 黒プレイヤー */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            stats.turn === 'black'
              ? 'bg-slate-900 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#1a1c23] border border-[#374151] inline-block shadow-sm" />
              <span className="text-xs font-bold text-slate-300">黒 (BLACK)</span>
            </div>
            {stats.turn === 'black' && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                {isAiThinking ? '思考中...' : '手番'}
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-display text-white">
              {stats.blackCount}
            </span>
            <span className="text-[11px] text-slate-400">
              2×2完成: <strong className="text-amber-400">{stats.blackBlocksCount}</strong>
            </span>
          </div>
        </div>

        {/* 白プレイヤー */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            stats.turn === 'white'
              ? 'bg-slate-900 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/40'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#f8fafc] border border-[#cbd5e1] inline-block shadow-sm" />
              <span className="text-xs font-bold text-slate-300">白 (WHITE)</span>
            </div>
            {stats.turn === 'white' && (
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                {isAiThinking ? '思考中...' : '手番'}
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-display text-white">
              {stats.whiteCount}
            </span>
            <span className="text-[11px] text-slate-400">
              2×2完成: <strong className="text-cyan-400">{stats.whiteBlocksCount}</strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
