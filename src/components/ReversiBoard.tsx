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
  turn: _turn,
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
    <div className="w-full max-w-[640px] mx-auto select-none">
      {/* クラシック・オセロ盤 */}
      <div className="aspect-square bg-[#008f00] p-1.5 sm:p-2 rounded-xl shadow-2xl border-4 border-[#005e00] flex flex-col justify-center items-center">
        {/* 16x16 グリッド */}
        <div className="w-full h-full grid grid-cols-16 grid-rows-16 gap-[1px] sm:gap-[1.5px] bg-[#006e00] p-[1px] sm:p-[1.5px] rounded-lg relative">
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isValid = validMoveMap.has(`${rIdx},${cIdx}`);
              const isLast = lastMove?.row === rIdx && lastMove?.col === cIdx;
              const isMega = megaFlipMap.has(`${rIdx},${cIdx}`);

              // 2x2 ブロック情報
              const bR = Math.floor(rIdx / BLOCK_SIZE);
              const bC = Math.floor(cIdx / BLOCK_SIZE);
              const dominance = getBlockDominance(board, { blockRow: bR, blockCol: bC });

              // 2マスごとの境界（2x2の区切り）
              const isBlockBorderRight = cIdx % 2 === 1 && cIdx !== BOARD_SIZE - 1;
              const isBlockBorderBottom = rIdx % 2 === 1 && rIdx !== BOARD_SIZE - 1;

              // 4マスごとの交差点にオセロの星（目印ドット）を配置
              const isStarPoint =
                (rIdx === 4 || rIdx === 8 || rIdx === 12) &&
                (cIdx === 4 || cIdx === 8 || cIdx === 12);

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => onCellClick(rIdx, cIdx)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${
                    isValid && showHints
                      ? 'bg-[#00c800] hover:bg-[#00db00]' // 打てる場所: 画像通りの鮮やかなライトグリーン
                      : dominance === 'black'
                      ? 'bg-[#007b00] hover:bg-[#008800]' // 黒の2x2完成ブロック内
                      : dominance === 'white'
                      ? 'bg-[#009e00] hover:bg-[#00aa00]' // 白の2x2完成ブロック内
                      : 'bg-[#008f00] hover:bg-[#009b00]'
                  } ${isBlockBorderRight ? 'border-r border-[#005200]/80' : ''} ${
                    isBlockBorderBottom ? 'border-b border-[#005200]/80' : ''
                  } ${isMega ? 'ring-2 ring-white z-10' : ''}`}
                >
                  {/* オセロ盤の星（目印の黒ドット） */}
                  {isStarPoint && !cell && (
                    <div className="absolute -top-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full z-10 pointer-events-none" />
                  )}

                  {/* 2x2完成ブロックのモノトーン目印マーク (ブロック左上マスに表示) */}
                  {rIdx % 2 === 0 && cIdx % 2 === 0 && dominance && (
                    <div
                      className={`absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full z-10 pointer-events-none shadow-sm ${
                        dominance === 'black'
                          ? 'bg-black border border-white/60'
                          : 'bg-white border border-black/40'
                      }`}
                    />
                  )}

                  {/* 石 (立体感のあるオセロ駒) */}
                  {cell && (
                    <div
                      className={`w-[86%] h-[86%] rounded-full flex items-center justify-center transition-transform duration-150 transform scale-95 ${
                        cell === 'black'
                          ? 'bg-gradient-to-b from-[#2a2a2a] via-[#151515] to-[#050505] shadow-[0_2px_4px_rgba(0,0,0,0.6)] border border-[#333]'
                          : 'bg-gradient-to-b from-[#ffffff] via-[#f4f4f4] to-[#dedede] shadow-[0_2px_4px_rgba(0,0,0,0.35)] border border-[#d0d0d0]'
                      } ${isLast ? 'ring-2 ring-white shadow-lg' : ''}`}
                    >
                      <div
                        className={`w-3/5 h-2/5 rounded-full opacity-30 -mt-1 ${
                          cell === 'black'
                            ? 'bg-gradient-to-b from-white to-transparent'
                            : 'bg-gradient-to-b from-white to-transparent'
                        }`}
                      />
                    </div>
                  )}

                  {/* 有効手のドット */}
                  {!cell && isValid && showHints && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#004d00] pointer-events-none" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 下部のモノトーン凡例 */}
      <div className="flex justify-between items-center text-xs text-neutral-400 mt-2.5 px-2 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-black border border-neutral-500 inline-block shadow-sm" />
          <span>黒の2×2完成</span>
        </div>
        <div className="text-neutral-500 text-[11px]">
          2×2を同色で揃えた時、直線上の敵石を一網打尽
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-neutral-400 inline-block shadow-sm" />
          <span>白の2×2完成</span>
        </div>
      </div>
    </div>
  );
};
