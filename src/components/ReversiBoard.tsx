import React from 'react';
import {
  BoardState,
  Position,
  PlayerColor,
  BOARD_SIZE,
  BLOCK_SIZE,
  BLOCKS_PER_SIDE,
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
    <div className="w-full max-w-[620px] mx-auto select-none">
      {/* 盤面本体 */}
      <div className="aspect-square bg-[#1b4332] rounded-2xl p-2 sm:p-2.5 shadow-2xl border border-[#2d6a4f]/50 flex flex-col justify-center items-center">
        {/* 8x8 の 2x2 ブロックグリッド */}
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-[2.5px] sm:gap-[3px] bg-[#143225] p-1 rounded-xl">
          {Array.from({ length: BLOCKS_PER_SIDE }).map((_, bR) =>
            Array.from({ length: BLOCKS_PER_SIDE }).map((_, bC) => {
              const dominance = getBlockDominance(board, { blockRow: bR, blockCol: bC });

              return (
                <div
                  key={`block-${bR}-${bC}`}
                  className={`relative grid grid-cols-2 grid-rows-2 gap-[1px] p-[1px] rounded-md transition-colors ${
                    dominance === 'black'
                      ? 'bg-slate-900/90 ring-1 ring-slate-600'
                      : dominance === 'white'
                      ? 'bg-slate-200/90 ring-1 ring-slate-400'
                      : 'bg-[#24523f]'
                  }`}
                >
                  {/* 完成ブロックの控えめな識別バッジ */}
                  {dominance && (
                    <div
                      className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full pointer-events-none z-10 ${
                        dominance === 'black' ? 'bg-amber-400' : 'bg-cyan-500'
                      }`}
                      title={`${dominance === 'black' ? '黒' : '白'}の完成2×2ブロック`}
                    />
                  )}

                  {/* 2x2内の4セル */}
                  {[0, 1].map((dr) =>
                    [0, 1].map((dc) => {
                      const r = bR * BLOCK_SIZE + dr;
                      const c = bC * BLOCK_SIZE + dc;
                      const cell = board[r][c];
                      const isClickable = validMoveMap.has(`${r},${c}`);
                      const isLast = lastMove?.row === r && lastMove?.col === c;
                      const isMega = megaFlipMap.has(`${r},${c}`);

                      return (
                        <div
                          key={`cell-${r}-${c}`}
                          onClick={() => onCellClick(r, c)}
                          className={`relative flex items-center justify-center cursor-pointer transition-colors rounded-[2px] ${
                            dominance
                              ? dominance === 'black'
                                ? 'bg-[#1b4332]/40 hover:bg-[#2d6a4f]/50'
                                : 'bg-[#2d6a4f]/60 hover:bg-[#3b8564]/70'
                              : 'bg-[#1b4332] hover:bg-[#23533e]'
                          } ${isMega ? 'ring-2 ring-amber-400/90 z-10' : ''}`}
                        >
                          {/* 石 (Disc) */}
                          {cell && (
                            <div
                              className={`w-[82%] h-[82%] rounded-full transition-transform duration-150 transform scale-95 flex items-center justify-center shadow-md ${
                                cell === 'black'
                                  ? 'bg-[#1a1c23] border border-[#374151] shadow-black/60'
                                  : 'bg-[#f8fafc] border border-[#cbd5e1] shadow-black/20'
                              } ${isLast ? 'ring-2 ring-amber-400' : ''}`}
                            >
                              <div
                                className={`w-2/5 h-2/5 rounded-full opacity-20 ${
                                  cell === 'black' ? 'bg-white' : 'bg-slate-400'
                                }`}
                              />
                            </div>
                          )}

                          {/* 有効手ヒントドット */}
                          {!cell && isClickable && showHints && (
                            <div
                              className={`w-2 h-2 rounded-full pointer-events-none ${
                                turn === 'black' ? 'bg-black/40 ring-1 ring-black/60' : 'bg-white/60 ring-1 ring-white/80'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 控えめでシンプルな凡例 */}
      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span>黒の2×2完成</span>
        </div>
        <div className="text-slate-500 text-[10px]">
          2×2の同色完成ブロックで直線上の敵石を挟めます
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
          <span>白の2×2完成</span>
        </div>
      </div>
    </div>
  );
};
