import {
  BoardState,
  PlayerColor,
  Position,
  BOARD_SIZE,
  GameMode,
} from '../types/reversi';
import { getValidMoves, makeMove } from './reversiLogic';

/**
 * 盤面のディープコピー
 */
function cloneBoard(board: BoardState): BoardState {
  return board.map((row) => [...row]);
}

/**
 * 16x16 盤面の位置価値マップ (重み付け)
 * 四隅、外枠、ブロックの要所を高く評価
 */
const WEIGHTS: number[][] = Array(BOARD_SIZE)
  .fill(0)
  .map(() => Array(BOARD_SIZE).fill(1));

// 重みテーブルの生成
for (let r = 0; r < BOARD_SIZE; r++) {
  for (let c = 0; c < BOARD_SIZE; c++) {
    // 基本点
    let w = 2;

    // 外枠 (Edge)
    if (r === 0 || r === BOARD_SIZE - 1 || c === 0 || c === BOARD_SIZE - 1) {
      w = 8;
    }

    // 外枠の1つ内側 (危険地帯)
    if (r === 1 || r === BOARD_SIZE - 2 || c === 1 || c === BOARD_SIZE - 2) {
      w = -4;
    }

    // 四隅 (Corners)
    const isCornerR = r === 0 || r === BOARD_SIZE - 1;
    const isCornerC = c === 0 || c === BOARD_SIZE - 1;
    if (isCornerR && isCornerC) {
      w = 100;
    }

    // 四隅の隣 (X打ち・C打ち) は大減点
    const isNearCornerR = r <= 1 || r >= BOARD_SIZE - 2;
    const isNearCornerC = c <= 1 || c >= BOARD_SIZE - 2;
    if (isNearCornerR && isNearCornerC && !(isCornerR && isCornerC)) {
      w = -25;
    }

    WEIGHTS[r][c] = w;
  }
}

/**
 * AIの手を計算
 */
export function getAiMove(
  board: BoardState,
  color: PlayerColor,
  mode: GameMode
): Position | null {
  const validMoves = getValidMoves(board, color);
  if (validMoves.length === 0) return null;

  if (mode === 'ai_easy') {
    // ランダム手 (70%) または 最多獲得手 (30%)
    if (Math.random() < 0.7) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
  }

  // 評価関数による最適手探索
  let bestScore = -Infinity;
  let bestMoves: Position[] = [];

  for (const move of validMoves) {
    const testBoard = cloneBoard(board);
    const result = makeMove(testBoard, move, color);
    if (!result) continue;

    let score = 0;

    // 1. 位置価値
    score += WEIGHTS[move.row][move.col] * 3;

    // 2. 通常獲得石数
    score += result.flippedNormal.length;

    // 3. 特別ルール: メガブロック反転ボーナス！ (超高評価)
    if (result.flippedMega.length > 0) {
      score += result.flippedMega.length * 6 + 40;
    }

    // 4. 新たに完成した 2x2 ブロックのボーナス
    score += result.completedBlocks.length * 25;

    // Hardモードの場合、相手の着手可能性（モビリティ）を減らす評価を追加
    if (mode === 'ai_hard') {
      const oppColor: PlayerColor = color === 'black' ? 'white' : 'black';
      const oppMoves = getValidMoves(testBoard, oppColor);
      score -= oppMoves.length * 2.5;

      // 相手に角を取らせないか簡易チェック
      for (const om of oppMoves) {
        if (
          (om.row === 0 || om.row === BOARD_SIZE - 1) &&
          (om.col === 0 || om.col === BOARD_SIZE - 1)
        ) {
          score -= 80;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)] || validMoves[0];
}
