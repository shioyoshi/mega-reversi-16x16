import React from 'react';
import { GameMode, GameStats, PlayerColor } from '../types/reversi';

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
  pvp: '👥 2人対戦',
  ai_easy: '🤖 CPU: かんたん',
  ai_medium: '🤖 CPU: ふつう',
  ai_hard: '🤖 CPU: つよい',
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
  const totalDiscs = stats.blackCount + stats.whiteCount;
  const blackPct = totalDiscs > 0 ? (stats.blackCount / totalDiscs) * 100 : 50;
  const whitePct = 100 - blackPct;

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-3 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* 上段: タイトル ＆ コントロール */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wider text-white font-display">
                MEGA REVERSI <span className="text-amber-400">16×16</span>
              </h1>
              <p className="text-[10px] text-slate-400">
                2×2ブロック連鎖反転・特別ルール搭載
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* モードセレクト */}
            <select
              value={mode}
              onChange={(e) => onModeChange(e.target.value as GameMode)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {(Object.keys(modeLabels) as GameMode[]).map((k) => (
                <option key={k} value={k}>
                  {modeLabels[k]}
                </option>
              ))}
            </select>

            <button
              onClick={onOpenRules}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-400 transition cursor-pointer flex items-center gap-1"
              title="ルール説明"
            >
              <span>📜</span>
              <span className="hidden sm:inline">ルール</span>
            </button>

            <button
              onClick={onUndo}
              disabled={!canUndo || isAiThinking}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                canUndo && !isAiThinking
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="待った (1手戻す)"
            >
              <span>↩️</span>
              <span className="hidden sm:inline">待った</span>
            </button>

            <button
              onClick={onToggleHints}
              className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                showHints
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
              title={showHints ? 'ヒントOFF' : 'ヒントON'}
            >
              💡
            </button>

            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 transition cursor-pointer text-xs"
              title={isMuted ? 'ミュート解除' : 'ミュート'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            <button
              onClick={onRestart}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition cursor-pointer text-xs"
              title="対局やり直し"
            >
              🔄
            </button>
          </div>
        </div>

        {/* 中段: スコア ＆ ターン表示 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          {/* 黒プレイヤー */}
          <div
            className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
              stats.turn === 'black'
                ? 'bg-purple-950/40 border-purple-500/60 shadow-md shadow-purple-500/20'
                : 'bg-slate-900/60 border-slate-800/80 opacity-70'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-slate-950 border border-purple-400 inline-block shadow-sm" />
              <div>
                <div className="text-[11px] font-bold text-purple-300">
                  黒 (BLACK) {stats.turn === 'black' && '👉 手番'}
                </div>
                <div className="text-[10px] text-slate-400">
                  完成ブロック: <strong className="text-purple-400">{stats.blackBlocksCount}</strong> 個
                </div>
              </div>
            </div>
            <div className="text-xl font-black font-display text-white">
              {stats.blackCount}
            </div>
          </div>

          {/* ターンステータス表示 */}
          <div className="text-center py-1">
            <div className="text-xs font-black font-display tracking-wider text-slate-200">
              {stats.isGameOver ? (
                <span className="text-amber-400 animate-pulse">🎉 対局終了 🎉</span>
              ) : isAiThinking ? (
                <span className="text-cyan-400 animate-pulse">🤖 CPU思考中...</span>
              ) : stats.turn === 'black' ? (
                <span className="text-purple-400">⚫ 黒の手番です</span>
              ) : (
                <span className="text-cyan-400">⚪ 白の手番です</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              手番数: {stats.moveHistoryCount} 手目
            </div>
          </div>

          {/* 白プレイヤー */}
          <div
            className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
              stats.turn === 'white'
                ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/60 border-slate-800/80 opacity-70'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white border border-slate-300 inline-block shadow-sm" />
              <div>
                <div className="text-[11px] font-bold text-cyan-300">
                  白 (WHITE) {stats.turn === 'white' && '👉 手番'}
                </div>
                <div className="text-[10px] text-slate-400">
                  完成ブロック: <strong className="text-cyan-400">{stats.whiteBlocksCount}</strong> 個
                </div>
              </div>
            </div>
            <div className="text-xl font-black font-display text-white">
              {stats.whiteCount}
            </div>
          </div>
        </div>

        {/* 下段: 盤面占有率バー */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex border border-slate-800">
          <div
            className="bg-purple-600 h-full transition-all duration-300"
            style={{ width: `${blackPct}%` }}
          />
          <div
            className="bg-cyan-400 h-full transition-all duration-300"
            style={{ width: `${whitePct}%` }}
          />
        </div>
      </div>
    </header>
  );
};
