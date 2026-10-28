import React from 'react';
import {
  BoardState,
  Position,
  PlayerColor,
  BOARD_SIZE,
  BLOCK_SIZE,
} from '../types/reversi';
import { getBlockDominance } from '../utils/reversiLogic';

interface ReversiBoardProps {
  board: BoardState;
  validMoves: Position[];
  lastMove: Position | null;
  lastFlipped: Position[];
  lastMegaFlipped: Position[];
  turn: PlayerColor;
  onCellClick: (row: number, col: number) => void;
  showHints: boolean;
}

export const ReversiBoard: React.FC<ReversiBoardProps> = ({
  board,
  validMoves,
  lastMove,
  lastFlipped: _lastFlipped,
  lastMegaFlipped,
  turn,
  onCellClick,
  showHints,
}) => {
  // 有効手セット
  const validMoveMap = new Map<string, boolean>();
  validMoves.forEach((m) => validMoveMap.set(`${m.row},${m.col}`, true));

  // メガ反転セット
  const megaFlipMap = new Map<string, boolean>();
  lastMegaFlipped.forEach((m) => megaFlipMap.set(`${m.row},${m.col}`, true));

  return (
    <div className="w-full max-w-[680px] mx-auto aspect-square p-2 sm:p-3 bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 rounded-3xl border-2 border-emerald-600/40 shadow-2xl shadow-emerald-950/80 flex flex-col justify-center items-center select-none relative">
      {/* 16x16 グリッドコンテナ */}
      <div className="w-full h-full grid grid-cols-16 grid-rows-16 gap-[1.5px] sm:gap-[2px] bg-emerald-900/40 p-1 sm:p-1.5 rounded-2xl border border-emerald-500/30 relative">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const isClickable = validMoveMap.has(`${rIdx},${cIdx}`);
            const isLastMove = lastMove?.row === rIdx && lastMove?.col === cIdx;
            const isMegaFlipped = megaFlipMap.has(`${rIdx},${cIdx}`);

            // 2x2 ブロックの境界線の計算 (2マスごとに太い境界線)
            const isBlockRightBorder = cIdx % BLOCK_SIZE === BLOCK_SIZE - 1 && cIdx !== BOARD_SIZE - 1;
            const isBlockBottomBorder = rIdx % BLOCK_SIZE === BLOCK_SIZE - 1 && rIdx !== BOARD_SIZE - 1;

            // このセルが属する 2x2 ブロックの完成状態
            const blockR = Math.floor(rIdx / BLOCK_SIZE);
            const blockC = Math.floor(cIdx / BLOCK_SIZE);
            const blockDominance = getBlockDominance(board, { blockRow: blockR, blockCol: blockC });

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                onClick={() => onCellClick(rIdx, cIdx)}
                className={`relative flex items-center justify-center cursor-pointer transition-all duration-150 rounded-sm sm:rounded-[3px] ${
                  blockDominance === 'black'
                    ? 'bg-purple-950/50 hover:bg-purple-900/60'
                    : blockDominance === 'white'
                    ? 'bg-cyan-950/50 hover:bg-cyan-900/60'
                    : 'bg-emerald-800/80 hover:bg-emerald-700/90'
                } ${
                  isBlockRightBorder ? 'mr-[2px] sm:mr-[3px]' : ''
                } ${
                  isBlockBottomBorder ? 'mb-[2px] sm:mb-[3px]' : ''
                } ${
                  isMegaFlipped ? 'animate-pulse ring-2 ring-amber-400 z-10' : ''
                }`}
                style={{
                  boxShadow:
                    blockDominance === 'black'
                      ? 'inset 0 0 6px rgba(168, 85, 247, 0.4)'
                      : blockDominance === 'white'
                      ? 'inset 0 0 6px rgba(56, 189, 248, 0.4)'
                      : undefined,
                }}
              >
                {/* 2x2 ブロック完成時のセンターバッジ (ブロックの左上マスに表示) */}
                {rIdx % 2 === 0 && cIdx % 2 === 0 && blockDominance && (
                  <div className="absolute -top-1 -left-1 z-20 pointer-events-none">
                    <span
                      className={`text-[8px] sm:text-[10px] font-black px-1 rounded-full shadow-md ${
                        blockDominance === 'black'
                          ? 'bg-purple-500 text-slate-950'
                          : 'bg-cyan-400 text-slate-950'
                      }`}
                      title={`${blockDominance === 'black' ? '黒' : '白'}の2x2完成ブロック`}
                    >
                      ★
                    </span>
                  </div>
                )}

                {/* 石 (Disc) */}
                {cell && (
                  <div
                    className={`w-[84%] h-[84%] rounded-full shadow-md transition-transform duration-200 transform scale-95 flex items-center justify-center relative ${
                      cell === 'black'
                        ? 'bg-gradient-to-br from-slate-700 via-slate-900 to-black border border-slate-700/80 shadow-black/80'
                        : 'bg-gradient-to-br from-white via-slate-100 to-slate-300 border border-slate-300 shadow-slate-950/40'
                    } ${isLastMove ? 'ring-2 ring-amber-400 animate-bounce' : ''}`}
                  >
                    {/* 石の立体的な光沢ライン */}
                    <div
                      className={`w-[50%] h-[50%] rounded-full opacity-30 ${
                        cell === 'black' ? 'bg-slate-400' : 'bg-white'
                      }`}
                    />
                  </div>
                )}

                {/* 有効手ヒントドット */}
                {!cell && isClickable && showHints && (
                  <div
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-transform hover:scale-150 ${
                      turn === 'black'
                        ? 'bg-slate-950/60 ring-1 ring-purple-400/80'
                        : 'bg-white/80 ring-1 ring-cyan-400/80'
                    } animate-pulse`}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 2x2 ブロック区切りガイド凡例 */}
      <div className="w-full mt-2 px-2 flex justify-between items-center text-[10px] sm:text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-500/30 border border-purple-400 inline-block" />
          <span>黒の2×2完成</span>
        </span>
        <span className="text-amber-400 font-bold hidden sm:inline">
          ⚡ 2×2が同色になると直線上の敵ブロックを一網打尽！
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-cyan-500/30 border border-cyan-400 inline-block" />
          <span>白の2×2完成</span>
        </span>
      </div>
    </div>
  );
};
