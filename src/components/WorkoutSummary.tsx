import React from 'react';
import { GameState } from '../types/game';
import { estimateInitialStats, calculateCurrent1RM, formatTonnage } from '../utils/calc';

interface WorkoutSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  onResetGame: () => void;
}

export const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  isOpen,
  onClose,
  state,
  onResetGame,
}) => {
  if (!isOpen) return null;

  const initial = estimateInitialStats(state.profile);
  const current1RM = calculateCurrent1RM(state);

  const bpGrowth = current1RM.benchPress - initial.initial1RM.benchPress;
  const sqGrowth = current1RM.squat - initial.initial1RM.squat;
  const dlGrowth = current1RM.deadlift - initial.initial1RM.deadlift;

  const userWeight = state.profile.weight;
  const elephantWeight = 5000; // アフリカゾウ約5t
  const elephantCount = (state.totalLiftedKg / elephantWeight).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-slate-100 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <h2 className="text-xl font-bold font-display text-white">トレーニング成長カルテ</h2>
              <p className="text-xs text-slate-400">
                初期測定からの筋力成長とリフティング記録
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* BIG 3 成長レポート */}
        <div className="space-y-3 mb-5">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            🏋️ 最大挙上重量 (1RM) の推移
          </h3>

          {/* ベンチプレス */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-rose-300">ベンチプレス (胸・上半身)</span>
              <span className="text-xs font-bold text-rose-400 font-display">
                初期: {initial.initial1RM.benchPress}kg →{' '}
                <span className="text-base font-extrabold text-white">{current1RM.benchPress}kg</span>
                {bpGrowth > 0 && <span className="text-emerald-400 ml-1.5">(+{bpGrowth}kg)</span>}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>自重比: {(current1RM.benchPress / userWeight).toFixed(2)}倍</span>
              <span>
                {current1RM.benchPress >= 100
                  ? '👑 100kgクラブ達成！エリートレベル'
                  : current1RM.benchPress >= userWeight
                  ? '自重ベンチ達成！中級者突破'
                  : '初級者〜自重ベンチを目指そう'}
              </span>
            </div>
          </div>

          {/* スクワット */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-indigo-300">スクワット (脚・下半身)</span>
              <span className="text-xs font-bold text-indigo-400 font-display">
                初期: {initial.initial1RM.squat}kg →{' '}
                <span className="text-base font-extrabold text-white">{current1RM.squat}kg</span>
                {sqGrowth > 0 && <span className="text-emerald-400 ml-1.5">(+{sqGrowth}kg)</span>}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>自重比: {(current1RM.squat / userWeight).toFixed(2)}倍</span>
              <span>
                {current1RM.squat >= userWeight * 1.5
                  ? '🔥 強靭な下半身！自重1.5倍クリア'
                  : '下半身の土台を強化中'}
              </span>
            </div>
          </div>

          {/* デッドリフト */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-amber-300">デッドリフト (背中・全身)</span>
              <span className="text-xs font-bold text-amber-400 font-display">
                初期: {initial.initial1RM.deadlift}kg →{' '}
                <span className="text-base font-extrabold text-white">{current1RM.deadlift}kg</span>
                {dlGrowth > 0 && <span className="text-emerald-400 ml-1.5">(+{dlGrowth}kg)</span>}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>自重比: {(current1RM.deadlift / userWeight).toFixed(2)}倍</span>
              <span>
                {current1RM.deadlift >= userWeight * 2
                  ? '🦍 モンスター級！自重2倍クリア'
                  : '背中の厚みを増強中'}
              </span>
            </div>
          </div>
        </div>

        {/* 累積ボリューム統計 */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 mb-5">
          <div className="text-xs font-bold text-slate-400 mb-2">総ボリューム実績</div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">総レップ数</div>
              <div className="text-base font-extrabold text-cyan-400 font-display">
                {state.totalReps.toLocaleString()} <span className="text-xs font-normal">回</span>
              </div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">総挙上重量 (トン数)</div>
              <div className="text-base font-extrabold text-emerald-400 font-display">
                {formatTonnage(state.totalLiftedKg)}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            🐘 あなたが持ち上げた重量は、アフリカゾウ <strong className="text-amber-400">{elephantCount}</strong> 頭分に相当します！
          </p>
        </div>

        {/* データ管理 */}
        <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            データは端末（localStorage）に自動保存されています
          </span>
          <button
            onClick={() => {
              if (window.confirm('ゲームの進行状況をすべて初期化してリセットしますか？')) {
                onResetGame();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
          >
            データをリセット
          </button>
        </div>
      </div>
    </div>
  );
};
