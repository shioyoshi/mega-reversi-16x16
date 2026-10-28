import React from 'react';
import { UpgradeItem } from '../types/game';
import { soundManager } from '../utils/audio';

interface NutritionShopProps {
  upgrades: UpgradeItem[];
  availableExp: number;
  totalPassiveExpPerSec: number;
  hasGymMembership: boolean;
  onBuyUpgrade: (upgrade: UpgradeItem) => void;
}

export const NutritionShop: React.FC<NutritionShopProps> = ({
  upgrades,
  availableExp,
  totalPassiveExpPerSec,
  onBuyUpgrade,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💊</span>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              ニュートリション＆施設ショップ
            </h3>
            <p className="text-xs text-slate-400">
              サプリメント・ギア・トレーナーで放置EXP＆獲得倍率を強化
            </p>
          </div>
        </div>

        <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <span className="text-xs text-slate-400">自動放置育成:</span>
          <span className="text-sm font-extrabold text-cyan-400 font-display">
            +{totalPassiveExpPerSec} EXP / 秒
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {upgrades.map((item) => {
          const isMax = item.maxCount !== undefined && item.ownedCount >= item.maxCount;
          const currentCost = Math.round(item.cost * Math.pow(1.25, item.ownedCount));
          const canAfford = availableExp >= currentCost && !isMax;

          return (
            <div
              key={item.id}
              className={`bg-slate-950/70 border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                item.id === 'gym_membership' && item.ownedCount === 0
                  ? 'border-amber-500/50 bg-amber-500/5 shadow-md shadow-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-display">
                        所持: {item.ownedCount} {item.maxCount ? `/ ${item.maxCount}` : ''}
                      </span>
                    </div>
                  </div>

                  {item.id === 'gym_membership' && item.ownedCount === 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold animate-pulse">
                      ジム解禁！
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed my-2 line-clamp-2">
                  {item.description}
                </p>

                {/* ボーナス表示 */}
                <div className="flex flex-wrap gap-1.5 my-2">
                  {item.passiveExpPerSec > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold font-display">
                      +{item.passiveExpPerSec} EXP/秒
                    </span>
                  )}
                  {item.clickMultiplier > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold font-display">
                      獲得量 +{Math.round((item.clickMultiplier - 1) * 100)}%
                    </span>
                  )}
                  {item.fatigueRecoveryMultiplier > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-display">
                      疲労回復 +{Math.round((item.fatigueRecoveryMultiplier - 1) * 100)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 mt-1">
                <button
                  onClick={() => {
                    soundManager.playPurchase();
                    onBuyUpgrade(item);
                  }}
                  disabled={!canAfford || isMax}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    isMax
                      ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : canAfford
                      ? item.id === 'gym_membership'
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/25 hover:brightness-110 active:scale-98'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 active:scale-98'
                      : 'bg-slate-900/60 text-slate-500 border border-slate-800/80 cursor-not-allowed'
                  }`}
                >
                  <span>{isMax ? '購入上限達成' : '購入する'}</span>
                  {!isMax && (
                    <span className="font-display font-extrabold">
                      {currentCost.toLocaleString()} EXP
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
