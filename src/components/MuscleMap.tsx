import React, { useState } from 'react';
import { MuscleStats, MuscleGroup } from '../types/game';

interface MuscleMapProps {
  muscleStats: MuscleStats;
  selectedMuscle: MuscleGroup | null;
  onSelectMuscle: (muscle: MuscleGroup | null) => void;
  isPumpMode: boolean;
}

export const MuscleMap: React.FC<MuscleMapProps> = ({
  muscleStats,
  selectedMuscle,
  onSelectMuscle,
  isPumpMode,
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  // 各部位のレベルと色彩の計算 (レベルが高いほど明るいシアン〜オレンジに進化)
  const getGlowColor = (level: number, isSelected: boolean) => {
    if (isSelected) return 'rgba(56, 189, 248, 0.95)'; // 明るいシアン
    if (isPumpMode) return 'rgba(249, 115, 22, 0.85)'; // パンプ時の燃えるオレンジ
    if (level >= 80) return 'rgba(236, 72, 153, 0.7)'; // ピンク
    if (level >= 40) return 'rgba(168, 85, 247, 0.6)'; // 紫
    if (level >= 20) return 'rgba(59, 130, 246, 0.6)'; // 青
    return 'rgba(71, 85, 105, 0.4)'; // グレー
  };

  const muscleInfo: Record<MuscleGroup, { name: string; icon: string; desc: string }> = {
    chest: { name: '大胸筋 (Chest)', icon: '🥋', desc: '腕立て・ベンチプレスで筋肥大' },
    core: { name: '腹筋・体幹 (Core)', icon: '🛡️', desc: 'クランチ・プランク・ドラゴンフラッグ' },
    legs: { name: '脚・下半身 (Legs)', icon: '🦵', desc: 'スクワット・ブルガリアン・レッグプレス' },
    back: { name: '背中・広背筋 (Back)', icon: '🦅', desc: '斜め懸垂・チンニング・デッドリフト' },
    arms: { name: '上腕筋群 (Arms)', icon: '💪', desc: 'カール・ディップス・三頭筋' },
    shoulders: { name: '三角筋 (Shoulders)', icon: '🥥', desc: 'パイク・OHP・ダンベルプレス' },
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧬</span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              マッスル・アナトミーマップ
            </h3>
            <p className="text-[11px] text-slate-400">部位タップで種目を絞り込み</p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setView('front')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              view === 'front'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            前面 (Front)
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              view === 'back'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            背面 (Back)
          </button>
        </div>
      </div>

      {/* SVG 人体モデル */}
      <div className="relative flex justify-center items-center py-2 h-64 bg-slate-950/60 rounded-xl border border-slate-800/60 overflow-hidden">
        {isPumpMode && (
          <div className="absolute inset-0 bg-radial from-orange-500/10 to-transparent pointer-events-none animate-pulse" />
        )}

        <svg
          viewBox="0 0 200 280"
          className="h-full max-w-[200px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-300 select-none"
        >
          {/* 頭部 */}
          <ellipse cx="100" cy="30" rx="16" ry="20" fill="#334155" />
          <path d="M 94 48 L 94 62 L 106 62 L 106 48 Z" fill="#334155" />

          {view === 'front' ? (
            /* 前面 */
            <>
              {/* 肩 (Shoulders) */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectMuscle(selectedMuscle === 'shoulders' ? null : 'shoulders')}
              >
                <path
                  d="M 68 62 C 60 64 52 74 54 88 C 62 86 70 78 74 65 Z"
                  fill={getGlowColor(muscleStats.shoulders, selectedMuscle === 'shoulders')}
                  stroke={selectedMuscle === 'shoulders' ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.5"
                />
                <path
                  d="M 132 62 C 140 64 148 74 146 88 C 138 86 130 78 126 65 Z"
                  fill={getGlowColor(muscleStats.shoulders, selectedMuscle === 'shoulders')}
                  stroke={selectedMuscle === 'shoulders' ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.5"
                />
              </g>

              {/* 大胸筋 (Chest) */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectMuscle(selectedMuscle === 'chest' ? null : 'chest')}
              >
                <path
                  d="M 76 65 C 88 65 98 70 98 86 C 88 92 76 90 70 82 C 68 74 70 68 76 65 Z"
                  fill={getGlowColor(muscleStats.chest, selectedMuscle === 'chest')}
                  stroke={selectedMuscle === 'chest' ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.5"
                />
                <path
                  d="M 124 65 C 112 65 102 70 102 86 C 112 92 124 90 130 82 C 132 74 130 68 124 65 Z"
                  fill={getGlowColor(muscleStats.chest, selectedMuscle === 'chest')}
                  stroke={selectedMuscle === 'chest' ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.5"
                />
              </g>

              {/* 腕 (Arms) */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectMuscle(selectedMuscle === 'arms' ? null : 'arms')}
              >
                {/* 左腕 */}
                <path
                  d="M 52 90 C 48 105 46 122 42 140 C 48 140 54 130 58 116 C 62 102 60 92 52 90 Z"
                  fill={getGlowColor(muscleStats.arms, selectedMuscle === 'arms')}
                  stroke={selectedMuscle === 'arms' ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.5"
                />
                {/* 右腕 */}
                <path
                  d="M 148 90 C 152 105 154 122 158 140 C 152 140 146 130 142 116 C 138 102 140 92 148 90 Z"
                  fill={getGlowColor(muscleStats.arms, selectedMuscle === 'arms')}
                  stroke={selectedMuscle === 'arms' ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.5"
                />
              </g>

              {/* 腹筋・体幹 (Core) */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectMuscle(selectedMuscle === 'core' ? null : 'core')}
              >
                <path
                  d="M 82 92 C 92 90 108 90 118 92 C 116 118 114 136 118 152 C 108 155 92 155 82 152 C 86 136 84 118 82 92 Z"
                  fill={getGlowColor(muscleStats.core, selectedMuscle === 'core')}
                  stroke={selectedMuscle === 'core' ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.5"
                />
                {/* 腹筋パックライン */}
                <line x1="100" y1="92" x2="100" y2="148" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="88" y1="110" x2="112" y2="110" stroke="#0f172a" strokeWidth="1" />
                <line x1="88" y1="128" x2="112" y2="128" stroke="#0f172a" strokeWidth="1" />
              </g>

              {/* 脚 (Legs - 大腿四頭筋) */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectMuscle(selectedMuscle === 'legs' ? null : 'legs')}
              >
                {/* 左脚 */}
                <path
                  d="M 80 155 C 72 175 68 205 72 235 C 78 238 88 238 92 235 C 96 205 94 175 92 155 Z"
                  fill={getGlowColor(muscleStats.legs, selectedMuscle === 'legs')}
                  stroke={selectedMuscle === 'legs' ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.5"
                />
                {/* 右脚 */}
                <path
                  d="M 120 155 C 128 175 132 205 128 235 C 122 238 112 238 108 235 C 104 205 106 175 108 155 Z"
                  fill={getGlowColor(muscleStats.legs, selectedMuscle === 'legs')}
                  stroke={selectedMuscle === 'legs' ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.5"
                />
                {/* ふくらはぎ */}
                <path d="M 72 238 L 74 270 L 88 270 L 90 238 Z" fill="#334155" />
                <path d="M 128 238 L 126 270 L 112 270 L 110 238 Z" fill="#334155" />
              </g>
            </>
          ) : (
            /* 背面 */
            <>
              {/* 背中・広背筋・僧帽筋 (Back) */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectMuscle(selectedMuscle === 'back' ? null : 'back')}
              >
                {/* 僧帽筋〜広背筋のV字 */}
                <path
                  d="M 80 62 L 120 62 L 132 85 C 130 115 116 142 100 148 C 84 142 70 115 68 85 Z"
                  fill={getGlowColor(muscleStats.back, selectedMuscle === 'back')}
                  stroke={selectedMuscle === 'back' ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.5"
                />
                {/* 脊柱起立筋ライン */}
                <line x1="100" y1="65" x2="100" y2="145" stroke="#0f172a" strokeWidth="2" strokeDasharray="3 3" />
              </g>

              {/* 肩・三頭筋 (Back View) */}
              <g
                className="cursor-pointer"
                onClick={() => onSelectMuscle(selectedMuscle === 'arms' ? null : 'arms')}
              >
                <path
                  d="M 50 90 C 46 105 44 122 40 140 C 46 140 52 130 56 116 C 60 102 58 92 50 90 Z"
                  fill={getGlowColor(muscleStats.arms, selectedMuscle === 'arms')}
                />
                <path
                  d="M 150 90 C 154 105 156 122 160 140 C 154 140 148 130 144 116 C 140 102 142 92 150 90 Z"
                  fill={getGlowColor(muscleStats.arms, selectedMuscle === 'arms')}
                />
              </g>

              {/* 臀筋・ハムストリングス (Legs Back) */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => onSelectMuscle(selectedMuscle === 'legs' ? null : 'legs')}
              >
                {/* 臀部 (お尻) */}
                <ellipse cx="88" cy="162" rx="14" ry="12" fill={getGlowColor(muscleStats.legs, selectedMuscle === 'legs')} />
                <ellipse cx="112" cy="162" rx="14" ry="12" fill={getGlowColor(muscleStats.legs, selectedMuscle === 'legs')} />
                {/* ハムストリングス */}
                <path
                  d="M 76 172 C 72 195 72 215 74 235 L 90 235 C 92 215 92 195 90 172 Z"
                  fill={getGlowColor(muscleStats.legs, selectedMuscle === 'legs')}
                  stroke={selectedMuscle === 'legs' ? '#38bdf8' : '#1e293b'}
                />
                <path
                  d="M 124 172 C 128 195 128 215 126 235 L 110 235 C 108 215 108 195 110 172 Z"
                  fill={getGlowColor(muscleStats.legs, selectedMuscle === 'legs')}
                  stroke={selectedMuscle === 'legs' ? '#38bdf8' : '#1e293b'}
                />
                {/* ふくらはぎ */}
                <path d="M 72 238 L 74 270 L 88 270 L 90 238 Z" fill="#334155" />
                <path d="M 128 238 L 126 270 L 112 270 L 110 238 Z" fill="#334155" />
              </g>
            </>
          )}
        </svg>

        {/* 選択中の部位チップ */}
        {selectedMuscle && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/95 border border-cyan-500/40 rounded-lg p-2 flex items-center justify-between text-xs backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
            <div>
              <span className="font-bold text-cyan-300">
                {muscleInfo[selectedMuscle].icon} {muscleInfo[selectedMuscle].name}
              </span>
              <span className="ml-2 font-display text-white font-extrabold">
                Lv.{muscleStats[selectedMuscle]}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">{muscleInfo[selectedMuscle].desc}</p>
            </div>
            <button
              onClick={() => onSelectMuscle(null)}
              className="text-slate-400 hover:text-white px-2 py-1 text-[11px] bg-slate-800 rounded"
            >
              解除
            </button>
          </div>
        )}
      </div>

      {/* 部位ステータスグリッド */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {(
          [
            { key: 'chest', label: '胸', icon: '🥋' },
            { key: 'back', label: '背中', icon: '🦅' },
            { key: 'legs', label: '脚', icon: '🦵' },
            { key: 'core', label: '体幹', icon: '🛡️' },
            { key: 'arms', label: '腕', icon: '💪' },
            { key: 'shoulders', label: '肩', icon: '🥥' },
          ] as { key: MuscleGroup; label: string; icon: string }[]
        ).map((m) => {
          const isSelected = selectedMuscle === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onSelectMuscle(isSelected ? null : m.key)}
              className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm shadow-cyan-500/30'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>{m.icon} {m.label}</span>
                <span className="font-bold text-cyan-400 font-display text-xs">
                  Lv.{muscleStats[m.key]}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (muscleStats[m.key] % 20) * 5)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
