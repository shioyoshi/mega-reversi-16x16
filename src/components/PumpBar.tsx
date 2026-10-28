import React from 'react';
import { soundManager } from '../utils/audio';

interface PumpBarProps {
  pumpGauge: number;
  isPumpMode: boolean;
  pumpTimeRemaining: number;
  fatigue: number;
  onRest: () => void;
  onDrinkShake: () => void;
  canAffordShake: boolean;
  shakeCost: number;
}

export const PumpBar: React.FC<PumpBarProps> = ({
  pumpGauge,
  isPumpMode,
  pumpTimeRemaining,
  fatigue,
  onRest,
  onDrinkShake,
  canAffordShake,
  shakeCost,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* パンプ感ゲージ */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-base animate-bounce">🔥</span>
              <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                {isPumpMode ? '✨ SUPER PUMP MODE 発動中！ ✨' : '筋肥大パンプ感ゲージ (PUMP)'}
              </span>
            </div>
            <span
              className={`text-xs font-extrabold font-display ${
                isPumpMode ? 'text-amber-400 animate-pulse' : 'text-orange-400'
              }`}
            >
              {isPumpMode ? `${pumpTimeRemaining}秒 (EXP 3倍 / 疲労ゼロ)` : `${Math.floor(pumpGauge)}%`}
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                isPumpMode
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 animate-pulse shadow-lg shadow-orange-500/50'
                  : 'bg-gradient-to-r from-orange-600 to-amber-400'
              }`}
              style={{
                width: isPumpMode ? `${(pumpTimeRemaining / 15) * 100}%` : `${pumpGauge}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {isPumpMode
              ? '全身の血流が最大化！今すぐ連打して筋肥大を爆発させろ！'
              : '連続で筋トレをこなすとゲージ上昇。100%で15秒間超覚醒！'}
          </p>
        </div>

        {/* 疲労度 & 超回復コントロール */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚡</span>
              <span className="text-xs font-bold text-slate-200 tracking-wide">
                筋肉の疲労蓄積 (FATIGUE)
              </span>
            </div>
            <span
              className={`text-xs font-bold font-display ${
                fatigue > 75 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-slate-400'
              }`}
            >
              {Math.floor(fatigue)}% {fatigue > 75 && '(筋肉痛注意!)'}
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                fatigue > 75
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              }`}
              style={{ width: `${fatigue}%` }}
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                soundManager.playRecovery();
                onRest();
              }}
              className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
            >
              <span>🧘</span>
              <span>深呼吸・休息 (-20%)</span>
            </button>

            <button
              onClick={() => {
                soundManager.playRecovery();
                onDrinkShake();
              }}
              disabled={!canAffordShake || fatigue <= 0}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                canAffordShake && fatigue > 0
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 active:scale-95'
                  : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
            >
              <span>🥤</span>
              <span>特濃プロテイン ({shakeCost} EXPで全快)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
