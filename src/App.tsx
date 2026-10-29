import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  BoardState,
  Position,
  PlayerColor,
  GameMode,
  GameStats,
} from './types/reversi';
import {
  createInitialBoard,
  getValidMoves,
  makeMove,
  getBoardStats,
} from './utils/reversiLogic';
import { getAiMove } from './utils/reversiAi';

import { ReversiBoard } from './components/ReversiBoard';
import { GameScoreHeader } from './components/GameScoreHeader';
import { RulesModal } from './components/RulesModal';
import { GameOverModal } from './components/GameOverModal';

interface HistorySnapshot {
  board: BoardState;
  turn: PlayerColor;
  lastMove: Position | null;
}

export const App: React.FC = () => {
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [turn, setTurn] = useState<PlayerColor>('black');
  const [mode, setMode] = useState<GameMode>('ai_medium');
  const [history, setHistory] = useState<HistorySnapshot[]>([]);

  const [lastMove, setLastMove] = useState<Position | null>(null);
  const [lastFlipped, setLastFlipped] = useState<Position[]>([]);
  const [lastMegaFlipped, setLastMegaFlipped] = useState<Position[]>([]);

  const [isAiThinking, setIsAiThinking] = useState(false);

  // 初回アクセス時に特別ルールのポップアップを自動表示
  const [isRulesOpen, setIsRulesOpen] = useState(true);

  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | 'draw' | null>(null);

  // トーストメッセージ (モノトーン)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const validMoves = getValidMoves(board, turn);
  const stats = getBoardStats(board);

  const gameStats: GameStats = {
    ...stats,
    turn,
    moveHistoryCount: history.length + 1,
    isGameOver,
    winner,
  };

  // 着手処理 (音声は常に無音)
  const executeMove = useCallback(
    (pos: Position, player: PlayerColor) => {
      setHistory((prev) => [
        ...prev,
        {
          board: board.map((r) => [...r]),
          turn: player,
          lastMove,
        },
      ]);

      const newBoard = board.map((r) => [...r]);
      const moveResult = makeMove(newBoard, pos, player);
      if (!moveResult) return;

      // 特別ルール: 今回新たに2x2を完成させたことによるメガ反転
      if (moveResult.flippedMega.length > 0) {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
        });
        setToastMessage(
          `⚡ 2×2完成！ 直線上の敵石 ${moveResult.flippedMega.length}マスを一網打尽！`
        );
        setTimeout(() => setToastMessage(null), 3000);
      }

      setBoard(newBoard);
      setLastMove(pos);
      setLastFlipped(moveResult.flippedNormal);
      setLastMegaFlipped(moveResult.flippedMega);

      const nextPlayer: PlayerColor = player === 'black' ? 'white' : 'black';
      const nextValidMoves = getValidMoves(newBoard, nextPlayer);

      if (nextValidMoves.length > 0) {
        setTurn(nextPlayer);
      } else {
        // パス判定
        const currentValidAgain = getValidMoves(newBoard, player);
        if (currentValidAgain.length > 0) {
          setToastMessage(`⚠️ ${nextPlayer === 'black' ? '黒' : '白'}は打てる場所がないためパス`);
          setTimeout(() => setToastMessage(null), 2500);
          setTurn(player);
        } else {
          endGame(newBoard);
        }
      }
    },
    [board, lastMove]
  );

  const endGame = (finalBoard: BoardState) => {
    setIsGameOver(true);
    const finalStats = getBoardStats(finalBoard);
    let winResult: PlayerColor | 'draw' = 'draw';
    if (finalStats.blackCount > finalStats.whiteCount) winResult = 'black';
    else if (finalStats.whiteCount > finalStats.blackCount) winResult = 'white';

    setWinner(winResult);
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
    });
  };

  const handleCellClick = (r: number, c: number) => {
    if (isGameOver || isAiThinking) return;
    if (mode !== 'pvp' && turn === 'white') return;

    const isValid = validMoves.some((m) => m.row === r && m.col === c);
    if (!isValid) return;

    executeMove({ row: r, col: c }, turn);
  };

  // CPUターン
  useEffect(() => {
    if (isGameOver || mode === 'pvp') return;

    if (turn === 'white') {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiMove = getAiMove(board, 'white', mode);
        if (aiMove) {
          executeMove(aiMove, 'white');
        } else {
          const blackMoves = getValidMoves(board, 'black');
          if (blackMoves.length > 0) {
            setToastMessage('⚠️ 白(CPU)は打てる手がないためパス');
            setTimeout(() => setToastMessage(null), 2000);
            setTurn('black');
          } else {
            endGame(board);
          }
        }
        setIsAiThinking(false);
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [turn, mode, board, isGameOver, executeMove]);

  // 待った
  const handleUndo = () => {
    if (history.length === 0 || isAiThinking) return;

    const steps = mode === 'pvp' ? 1 : history.length >= 2 ? 2 : 1;
    const targetIdx = history.length - steps;
    const target = history[targetIdx];

    if (target) {
      setBoard(target.board);
      setTurn(target.turn);
      setLastMove(target.lastMove);
      setLastFlipped([]);
      setLastMegaFlipped([]);
      setHistory((prev) => prev.slice(0, targetIdx));
      setIsGameOver(false);
      setWinner(null);
    }
  };

  // 対局リセット (モード変更時や終局後)
  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn('black');
    setHistory([]);
    setLastMove(null);
    setLastFlipped([]);
    setLastMegaFlipped([]);
    setIsGameOver(false);
    setWinner(null);
    setIsAiThinking(false);
    setToastMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans select-none pb-8">
      {/* スコア ＆ 最小限の操作ヘッダー (パス・通知は既存の隙間スロットで代替表示し盤面移動を防止) */}
      <GameScoreHeader
        stats={gameStats}
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          resetGame();
        }}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        onOpenRules={() => setIsRulesOpen(true)}
        isAiThinking={isAiThinking}
        message={toastMessage}
      />

      {/* 盤面 (ヒント常に表示・通知による上下移動完全ゼロ) */}
      <main className="max-w-2xl mx-auto px-2 sm:px-4 py-1 w-full flex-1 flex flex-col items-center justify-center">
        <ReversiBoard
          board={board}
          validMoves={validMoves}
          lastMove={lastMove}
          lastFlipped={lastFlipped}
          lastMegaFlipped={lastMegaFlipped}
          turn={turn}
          onCellClick={handleCellClick}
        />
      </main>

      {/* 特別ルール解説モーダル (初回アクセス時自動表示) */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        isFirstVisit={true}
      />

      {/* 終局結果モーダル */}
      <GameOverModal
        isOpen={isGameOver}
        stats={gameStats}
        onRestart={resetGame}
      />
    </div>
  );
};

export default App;
