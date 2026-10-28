export type PlayerColor = 'black' | 'white';
export type CellValue = PlayerColor | null;

export const BOARD_SIZE = 16;
export const BLOCK_SIZE = 2; // 2x2
export const BLOCKS_PER_SIDE = 8; // 16 / 2 = 8

export type BoardState = CellValue[][];

export interface Position {
  row: number;
  col: number;
}

export interface BlockPosition {
  blockRow: number;
  blockCol: number;
}

export interface MoveResult {
  placed: Position;
  flippedNormal: Position[];
  flippedMega: Position[];
  completedBlocks: BlockPosition[];
}

export type GameMode = 'pvp' | 'ai_easy' | 'ai_medium' | 'ai_hard';

export interface GameStats {
  blackCount: number;
  whiteCount: number;
  blackBlocksCount: number;
  whiteBlocksCount: number;
  turn: PlayerColor;
  moveHistoryCount: number;
  isGameOver: boolean;
  winner: PlayerColor | 'draw' | null;
}
