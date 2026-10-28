import React, { useState } from 'react';
import { UserProfile, Gender } from '../types/game';
import { estimateInitialStats } from '../utils/calc';
import { soundManager } from '../utils/audio';

interface ProfileModalProps {
  currentProfile: UserProfile;
  isOpen: boolean;
  onSave: (profile: UserProfile) => void;
  onClose?: () => void;
  isFirstTime?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentProfile,
  isOpen,
  onSave,
  onClose,
  isFirstTime = false,
}) => {
  const [name, setName] = useState(currentProfile.name || 'トレーニー');
  const [height, setHeight] = useState(currentProfile.height || 172);
  const [weight, setWeight] = useState(currentProfile.weight || 68);
  const [gender, setGender] = useState<Gender>(currentProfile.gender || 'male');
  const [age, setAge] = useState(currentProfile.age || 26);
  const [experienceLevel, setExperienceLevel] = useState<UserProfile['experienceLevel']>(
    currentProfile.experienceLevel || 'beginner'
  );

  if (!isOpen) return null;

  // リアルタイム推定値のプレビュー
  const previewProfile: UserProfile = {
    name,
    height,
    weight,
    gender,
    age,
    experienceLevel,
    isInitialized: true,
  };
  const estimated = estimateInitialStats(previewProfile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playLevelUp();
    onSave(previewProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💪</span>
            <div>
              <h2 className="text-xl font-bold font-display text-white">
                {isFirstTime ? 'トレーニー・プロファイル作成' : 'プロファイル・身体測定設定'}
              </h2>
              <p className="text-xs text-slate-400">
                あなたの体格に合わせて初期筋力・BIG3推定値を算出します
              </p>
            </div>
          </div>
          {!isFirstTime && onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xl p-1 rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ニックネーム</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={12}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="例: たけし"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">性別</label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'other'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      gender === g
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {g === 'male' ? '男性 ♂' : g === 'female' ? '女性 ♀' : 'その他'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">身長</label>
                <span className="text-sm font-bold text-cyan-400 font-display">{height} cm</span>
              </div>
              <input
                type="range"
                min="140"
                max="210"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>140cm</span>
                <span>175cm</span>
                <span>210cm</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">体重</label>
                <span className="text-sm font-bold text-cyan-400 font-display">{weight} kg</span>
              </div>
              <input
                type="range"
                min="40"
                max="140"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>40kg</span>
                <span>70kg</span>
                <span>140kg</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">年齢</label>
                <span className="text-sm font-bold text-cyan-400 font-display">{age} 歳</span>
              </div>
              <input
                type="range"
                min="14"
                max="80"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">筋トレ・運動経験</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as UserProfile['experienceLevel'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="beginner">初心者（運動習慣なし〜少し）</option>
                <option value="intermediate">中級者（部活経験・半年以上トレ歴）</option>
                <option value="advanced">上級者（本格筋トレ1年以上）</option>
              </select>
            </div>
          </div>

          {/* リアルタイム推定値カード */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                身体測定 ＆ 初期筋力推定
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                BMI: {estimated.bmi} ({estimated.bmi < 18.5 ? '低体重' : estimated.bmi < 25 ? '標準' : '肥満'})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                <div className="text-[10px] text-slate-400">推定体脂肪率</div>
                <div className="text-sm font-bold text-white font-display">{estimated.bodyFatPercent}%</div>
              </div>
              <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                <div className="text-[10px] text-slate-400">除脂肪体重 (LBM)</div>
                <div className="text-sm font-bold text-cyan-400 font-display">{estimated.leanBodyMass} kg</div>
              </div>
              <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                <div className="text-[10px] text-slate-400">基礎筋力スコア</div>
                <div className="text-sm font-bold text-amber-400 font-display">
                  {Math.round(
                    (estimated.muscleStats.chest +
                      estimated.muscleStats.back +
                      estimated.muscleStats.legs +
                      estimated.muscleStats.core) / 4
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-2">
              <div className="text-[11px] text-slate-400 mb-2 font-medium">
                🏋️‍♂️ あなたの現在の推定最大挙上重量 (初期1RM):
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-rose-300">ベンチプレス</div>
                  <div className="text-base font-extrabold text-rose-400 font-display">
                    {estimated.initial1RM.benchPress} <span className="text-xs font-normal">kg</span>
                  </div>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-indigo-300">スクワット</div>
                  <div className="text-base font-extrabold text-indigo-400 font-display">
                    {estimated.initial1RM.squat} <span className="text-xs font-normal">kg</span>
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-amber-300">デッドリフト</div>
                  <div className="text-base font-extrabold text-amber-400 font-display">
                    {estimated.initial1RM.deadlift} <span className="text-xs font-normal">kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition transform cursor-pointer text-sm tracking-wide"
            >
              {isFirstTime ? 'このステータスで筋トレを始める！💪' : '身体データを更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
