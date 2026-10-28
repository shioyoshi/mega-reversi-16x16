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
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | 'draw' | null>(null);
  const [showHints, setShowHints] = useState(true);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  // メガ反転のアナウンスバナー
  const [megaBanner, setMegaBanner] = useState<string | null>(null);

  // 現在の合法手
  const validMoves = getValidMoves(board, turn);
  const stats = getBoardStats(board);

  // ゲーム状態集計オブジェクト
  const gameStats: GameStats = {
    ...stats,
    turn,
    moveHistoryCount: history.length + 1,
    isGameOver,
    winner,
  };

  // メインの着手処理
  const executeMove = useCallback(
    (pos: Position, player: PlayerColor) => {
      // 履歴のスナップショットを保存
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

      // 通常反転の演出
      if (moveResult.flippedNormal.length > 0) {
        soundManager.playFlipPiece(moveResult.flippedNormal.length);
      }

      // 特別ルール: 2x2 メガ反転の演出
      if (moveResult.flippedMega.length > 0) {
        soundManager.playMegaReversal();
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
        setMegaBanner(
          `⚡ MEGA REVERSAL! 2×2ブロックで ${moveResult.flippedMega.length}マスを一網打尽！ ⚡`
        );
        setTimeout(() => setMegaBanner(null), 3500);
      }

      setBoard(newBoard);
      setLastMove(pos);
      setLastFlipped(moveResult.flippedNormal);
      setLastMegaFlipped(moveResult.flippedMega);

      // 手番の交代判定
      const nextPlayer: PlayerColor = player === 'black' ? 'white' : 'black';
      const nextValidMoves = getValidMoves(newBoard, nextPlayer);

      if (nextValidMoves.length > 0) {
        setTurn(nextPlayer);
      } else {
        // 次のプレイヤーに打てる手がない (パス判定)
        const currentValidAgain = getValidMoves(newBoard, player);
        if (currentValidAgain.length > 0) {
          // パスして現在のプレイヤーがもう一度打つ
          setMegaBanner(`⚠️ ${nextPlayer === 'black' ? '黒' : '白'}は打てる場所がないためパス！`);
          setTimeout(() => setMegaBanner(null), 2500);
          setTurn(player);
        } else {
          // 両者ともに打てない -> 終局！
          endGame(newBoard);
        }
      }
    },
    [board, lastMove]
  );

  // 終局処理
  const endGame = (finalBoard: BoardState) => {
    setIsGameOver(true);
    const finalStats = getBoardStats(finalBoard);
    let winResult: PlayerColor | 'draw' = 'draw';
    if (finalStats.blackCount > finalStats.whiteCount) winResult = 'black';
    else if (finalStats.whiteCount > finalStats.blackCount) winResult = 'white';

    setWinner(winResult);
    soundManager.playWin();
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5 },
    });
  };

  // セルクリックハンドラ (人間プレイヤー)
  const handleCellClick = (r: number, c: number) => {
    if (isGameOver || isAiThinking) return;

    // CPU戦で白の番ならクリック無効
    if (mode !== 'pvp' && turn === 'white') return;

    const isValid = validMoves.some((m) => m.row === r && m.col === c);
    if (!isValid) return;

    executeMove({ row: r, col: c }, turn);
  };

  // AI（CPU）の思考ターン
  useEffect(() => {
    if (isGameOver) return;
    if (mode === 'pvp') return;

    if (turn === 'white') {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiMove = getAiMove(board, 'white', mode);
        if (aiMove) {
          executeMove(aiMove, 'white');
        } else {
          // AIに打てる手がない場合はパス
          const blackMoves = getValidMoves(board, 'black');
          if (blackMoves.length > 0) {
            setMegaBanner('⚠️ 白(CPU)は打てる場所がないためパス！');
            setTimeout(() => setMegaBanner(null), 2000);
            setTurn('black');
          } else {
            endGame(board);
          }
        }
        setIsAiThinking(false);
      }, 550);

      return () => clearTimeout(timer);
    }
  }, [turn, mode, board, isGameOver, executeMove]);

  // 待った (アンドゥ)
  const handleUndo = () => {
    if (history.length === 0 || isAiThinking) return;

    // 対人戦なら1手戻す、CPU戦ならCPUの手と自分の手を2手戻す
    const stepsToUndo = mode === 'pvp' ? 1 : history.length >= 2 ? 2 : 1;
    const targetIdx = history.length - stepsToUndo;
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

  // 対局やり直し
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
    setMegaBanner(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-12">
      {/* ヘッダー＆スコアボード */}
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

      {/* メガ反転・パストーストバナー */}
      {megaBanner && (
        <div className="w-full max-w-xl mx-auto px-4 mt-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-black px-4 py-2.5 rounded-2xl shadow-xl text-center text-xs sm:text-sm tracking-wide">
            {megaBanner}
          </div>
        </div>
      )}

      {/* 盤面メインコンテナ */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 w-full flex-1 flex flex-col items-center justify-center">
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

      {/* モーダル群 */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <GameOverModal
        isOpen={isGameOver}
        stats={gameStats}
        onRestart={handleRestart}
      />
    </div>
  );
};

export default App;
