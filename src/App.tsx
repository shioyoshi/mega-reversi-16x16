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
import { soundManager } from './utils/reversiAudio';

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
  const [showHints, setShowHints] = useState(true);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  // メガ反転トーストメッセージ
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 現在の合法手
  const validMoves = getValidMoves(board, turn);
  const stats = getBoardStats(board);

  const gameStats: GameStats = {
    ...stats,
    turn,
    moveHistoryCount: history.length + 1,
    isGameOver,
    winner,
  };

  // 着手処理
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

      soundManager.playPlacePiece();

      if (moveResult.flippedNormal.length > 0) {
        soundManager.playFlipPiece(moveResult.flippedNormal.length);
      }

      // 特別ルール: メガブロック反転発生時
      if (moveResult.flippedMega.length > 0) {
        soundManager.playMegaReversal();
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
        setToastMessage(
          `⚡ 2×2ブロック連鎖反転！ ${moveResult.flippedMega.length}マスを挟み撃ち！`
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
    soundManager.playWin();
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

  // CPU思考ターン
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
      }, 500);

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

  // リセット
  const handleRestart = () => {
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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans select-none pb-8">
      {/* スコア ＆ コントロールヘッダー */}
      <GameScoreHeader
        stats={gameStats}
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          handleRestart();
        }}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        onRestart={handleRestart}
        onOpenRules={() => setIsRulesOpen(true)}
        showHints={showHints}
        onToggleHints={() => setShowHints((h) => !h)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(soundManager.toggleMute())}
        isAiThinking={isAiThinking}
      />

      {/* スタイリッシュなトースト通知 */}
      {toastMessage && (
        <div className="w-full max-w-md mx-auto px-4 mt-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="bg-slate-800 text-amber-300 border border-amber-400/30 font-bold px-3 py-2 rounded-xl text-center text-xs shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}

      {/* 盤面 */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-2 w-full flex-1 flex flex-col items-center justify-center">
        <ReversiBoard
          board={board}
          validMoves={validMoves}
          lastMove={lastMove}
          lastFlipped={lastFlipped}
          lastMegaFlipped={lastMegaFlipped}
          turn={turn}
          onCellClick={handleCellClick}
          showHints={showHints}
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
        onRestart={handleRestart}
      />
    </div>
  );
};

export default App;
