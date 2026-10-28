import {
  BoardState,
  PlayerColor,
  Position,
  BlockPosition,
  MoveResult,
  BOARD_SIZE,
  BLOCK_SIZE,
  BLOCKS_PER_SIDE,
} from '../types/reversi';

const DIRECTIONS = [
  { r: -1, c: -1 },
  { r: -1, c: 0 },
  { r: -1, c: 1 },
  { r: 0, c: -1 },
  { r: 0, c: 1 },
  { r: 1, c: -1 },
  { r: 1, c: 0 },
  { r: 1, c: 1 },
];

/**
 * 16x16 の初期盤面を生成
 */
export function createInitialBoard(): BoardState {
  const board: BoardState = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  // 盤面中央 (7, 8行 / 7, 8列) に白黒を交互配置
  // ちょうど中央の 2x2 ブロック (ブロック3,3) 内に配置
  board[7][7] = 'white';
  board[7][8] = 'black';
  board[8][7] = 'black';
  board[8][8] = 'white';

  return board;
}

/**
 * 指定マスに石を置いた場合に裏返せる石のリストを取得 (通常オセロルール)
 */
export function getFlippableDiscs(
  board: BoardState,
  pos: Position,
  color: PlayerColor
): Position[] {
  if (board[pos.row][pos.col] !== null) return [];

  const opponent: PlayerColor = color === 'black' ? 'white' : 'black';
  const flippable: Position[] = [];

  for (const dir of DIRECTIONS) {
    let r = pos.row + dir.r;
    let c = pos.col + dir.c;
    const currentRay: Position[] = [];

    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      if (board[r][c] === opponent) {
        currentRay.push({ row: r, col: c });
      } else if (board[r][c] === color) {
        if (currentRay.length > 0) {
          flippable.push(...currentRay);
        }
        break;
      } else {
        break;
      }
      r += dir.r;
      c += dir.c;
    }
  }

  return flippable;
}

/**
 * 現在のプレイヤーが打てるすべての合法手を取得
 */
export function getValidMoves(board: BoardState, color: PlayerColor): Position[] {
  const validMoves: Position[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) {
        const flips = getFlippableDiscs(board, { row: r, col: c }, color);
        if (flips.length > 0) {
          validMoves.push({ row: r, col: c });
        }
      }
    }
  }

  return validMoves;
}

/**
 * 2x2 ブロック (bR, bC) の状態を判定
 * 4マスすべて自色ならその色を返す。それ以外は null
 */
export function getBlockDominance(
  board: BoardState,
  blockPos: BlockPosition
): PlayerColor | null {
  const startR = blockPos.blockRow * BLOCK_SIZE;
  const startC = blockPos.blockCol * BLOCK_SIZE;

  const first = board[startR][startC];
  if (first === null) return null;

  for (let dr = 0; dr < BLOCK_SIZE; dr++) {
    for (let dc = 0; dc < BLOCK_SIZE; dc++) {
      if (board[startR + dr][startC + dc] !== first) {
        return null;
      }
    }
  }

  return first;
}

/**
 * 盤面全体の完成している 2x2 ブロックの一覧を取得
 */
export function getAllCompletedBlocks(
  board: BoardState
): { black: BlockPosition[]; white: BlockPosition[] } {
  const black: BlockPosition[] = [];
  const white: BlockPosition[] = [];

  for (let bR = 0; bR < BLOCKS_PER_SIDE; bR++) {
    for (let bC = 0; bC < BLOCKS_PER_SIDE; bC++) {
      const color = getBlockDominance(board, { blockRow: bR, blockCol: bC });
      if (color === 'black') black.push({ blockRow: bR, blockCol: bC });
      if (color === 'white') white.push({ blockRow: bR, blockCol: bC });
    }
  }

  return { black, white };
}

/**
 * 特別ルール: 2x2 メガブロックによる反転処理
 * 【重要】今回の手によって「新たに完成した 2x2 ブロック」のみを起点として挟み込み判定を行う！
 * 既に完成していたブロックから毎ターン勝手に再発動することはない。
 */
export function evaluateNewlyCompletedBlockReversals(
  board: BoardState,
  color: PlayerColor,
  newlyCompletedBlocks: BlockPosition[]
): { flippedPositions: Position[]; completedBlocks: BlockPosition[] } {
  if (newlyCompletedBlocks.length === 0) {
    const { black, white } = getAllCompletedBlocks(board);
    return { flippedPositions: [], completedBlocks: color === 'black' ? black : white };
  }

  const opponent: PlayerColor = color === 'black' ? 'white' : 'black';
  const flipped: Position[] = [];
  const flippedSet = new Set<string>();

  const BLOCK_DIRECTIONS = [
    { dr: -1, dc: -1 },
    { dr: -1, dc: 0 },
    { dr: -1, dc: 1 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
    { dr: 1, dc: -1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
  ];

  // 現在のブロック状態マップ (8x8)
  const blockGrid: (PlayerColor | 'has_opponent' | 'empty')[] = [];
  for (let bR = 0; bR < BLOCKS_PER_SIDE; bR++) {
    for (let bC = 0; bC < BLOCKS_PER_SIDE; bC++) {
      const dom = getBlockDominance(board, { blockRow: bR, blockCol: bC });
      if (dom) {
        blockGrid[bR * BLOCKS_PER_SIDE + bC] = dom;
      } else {
        let hasOpp = false;
        const sR = bR * BLOCK_SIZE;
        const sC = bC * BLOCK_SIZE;
        for (let dr = 0; dr < BLOCK_SIZE; dr++) {
          for (let dc = 0; dc < BLOCK_SIZE; dc++) {
            if (board[sR + dr][sC + dc] === opponent) hasOpp = true;
          }
        }
        blockGrid[bR * BLOCKS_PER_SIDE + bC] = hasOpp ? 'has_opponent' : 'empty';
      }
    }
  }

  // 今回新しく完成したブロックのみを起点にスキャン！
  for (const newBlock of newlyCompletedBlocks) {
    const bR = newBlock.blockRow;
    const bC = newBlock.blockCol;

    for (const dir of BLOCK_DIRECTIONS) {
      let currR = bR + dir.dr;
      let currC = bC + dir.dc;
      const blocksInBetween: BlockPosition[] = [];

      while (
        currR >= 0 &&
        currR < BLOCKS_PER_SIDE &&
        currC >= 0 &&
        currC < BLOCKS_PER_SIDE
      ) {
        const status = blockGrid[currR * BLOCKS_PER_SIDE + currC];

        if (status === opponent || status === 'has_opponent') {
          blocksInBetween.push({ blockRow: currR, blockCol: currC });
        } else if (status === color) {
          // 直線上の別の自色完成ブロックに到達！
          if (blocksInBetween.length > 0) {
            for (const b of blocksInBetween) {
              const baseR = b.blockRow * BLOCK_SIZE;
              const baseC = b.blockCol * BLOCK_SIZE;
              for (let dr = 0; dr < BLOCK_SIZE; dr++) {
                for (let dc = 0; dc < BLOCK_SIZE; dc++) {
                  const posKey = `${baseR + dr},${baseC + dc}`;
                  if (board[baseR + dr][baseC + dc] === opponent && !flippedSet.has(posKey)) {
                    flippedSet.add(posKey);
                    flipped.push({ row: baseR + dr, col: baseC + dc });
                  }
                }
              }
            }
          }
          break;
        } else {
          break;
        }

        currR += dir.dr;
        currC += dir.dc;
      }
    }
  }

  // 反転を実行
  for (const pos of flipped) {
    board[pos.row][pos.col] = color;
  }

  const { black, white } = getAllCompletedBlocks(board);
  const completed = color === 'black' ? black : white;

  return { flippedPositions: flipped, completedBlocks: completed };
}

/**
 * 1手を適用するメイン関数 (通常反転 + 今回新規に完成した2x2ブロックによる特別反転)
 */
export function makeMove(
  board: BoardState,
  pos: Position,
  color: PlayerColor
): MoveResult | null {
  const normalFlips = getFlippableDiscs(board, pos, color);
  if (normalFlips.length === 0) return null;

  // 着手前の自色完成ブロック一覧を記録
  const beforeCompleted = getAllCompletedBlocks(board)[color];
  const beforeKeySet = new Set(
    beforeCompleted.map((b) => `${b.blockRow},${b.blockCol}`)
  );

  // 1. 通常の石配置＆反転
  board[pos.row][pos.col] = color;
  for (const p of normalFlips) {
    board[p.row][p.col] = color;
  }

  // 2. 着手後に新しく完成した 2x2 ブロックを特定
  const afterCompleted = getAllCompletedBlocks(board)[color];
  const newlyCompleted = afterCompleted.filter(
    (b) => !beforeKeySet.has(`${b.blockRow},${b.blockCol}`)
  );

  // 3. 新規完成ブロックのみを起点に特別反転を発動
  const allMegaFlips: Position[] = [];
  let latestCompleted = afterCompleted;

  if (newlyCompleted.length > 0) {
    const { flippedPositions, completedBlocks } = evaluateNewlyCompletedBlockReversals(
      board,
      color,
      newlyCompleted
    );
    allMegaFlips.push(...flippedPositions);
    latestCompleted = completedBlocks;
  }

  return {
    placed: pos,
    flippedNormal: normalFlips,
    flippedMega: allMegaFlips,
    completedBlocks: latestCompleted,
  };
}

/**
 * 盤面の石数および完成ブロック数を集計
 */
export function getBoardStats(board: BoardState) {
  let blackCount = 0;
  let whiteCount = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'black') blackCount++;
      if (board[r][c] === 'white') whiteCount++;
    }
  }

  const { black, white } = getAllCompletedBlocks(board);

  return {
    blackCount,
    whiteCount,
    blackBlocksCount: black.length,
    whiteBlocksCount: white.length,
  };
}
