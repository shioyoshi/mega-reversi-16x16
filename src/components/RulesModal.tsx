import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstVisit?: boolean;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  isFirstVisit = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 my-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              {isFirstVisit ? 'ようこそ！16×16 オセロ 特別ルール' : '特別ルールの解説'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              通常のオセロルール ＋ 2×2ブロック挟み込み機能
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* 3ステップ図解 */}
        <div className="space-y-4 text-xs leading-relaxed">
          {/* STEP 1: 2x2 ブロックを揃える */}
          <div className="bg-slate-950/90 rounded-xl p-3.5 border border-slate-800 flex items-center gap-4">
            <div className="shrink-0 w-16 h-16 bg-emerald-950 border border-emerald-700/60 rounded-lg p-1 grid grid-cols-2 grid-rows-2 gap-1 shadow-inner">
              <div className="bg-slate-900 rounded-full border border-slate-700 shadow-sm" />
              <div className="bg-slate-900 rounded-full border border-slate-700 shadow-sm" />
              <div className="bg-slate-900 rounded-full border border-slate-700 shadow-sm" />
              <div className="bg-slate-900 rounded-full border border-slate-700 shadow-sm" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 mb-1">
                STEP 1. 縦横1/8の「2×2マス」を同色で制覇！
              </div>
              <p className="text-slate-300 text-[11px]">
                盤面は2×2（計64区画）に太線で区切られています。
                この4マスすべてを同じ色で埋めると<strong>【完成ブロック】</strong>になります。
              </p>
            </div>
          </div>

          {/* STEP 2: 別の完成ブロックで挟む */}
          <div className="bg-slate-950/90 rounded-xl p-3.5 border border-slate-800 flex items-center gap-4">
            <div className="shrink-0 w-16 h-16 bg-emerald-950 border border-emerald-700/60 rounded-lg p-1.5 flex flex-col justify-between items-center shadow-inner">
              <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700" />
              <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 animate-pulse" />
              <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700" />
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-400 mb-1">
                STEP 2. 直線上に別の「完成ブロック」があると…
              </div>
              <p className="text-slate-300 text-[11px]">
                縦・横・斜めの直線上に、同じ色の完成ブロックがもう1つ存在し、その間に相手の石がある場合…
              </p>
            </div>
          </div>

          {/* STEP 3: 一網打尽に大反転 */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 rounded-xl p-3.5 border border-amber-500/30 flex items-center gap-4">
            <div className="shrink-0 w-16 h-16 bg-emerald-950 border border-amber-500/60 rounded-lg p-1.5 flex flex-col justify-between items-center shadow-inner">
              <div className="w-4 h-4 rounded-full bg-slate-900 border border-amber-400 shadow" />
              <div className="w-4 h-4 rounded-full bg-slate-900 border border-amber-400 shadow transition-all duration-300" />
              <div className="w-4 h-4 rounded-full bg-slate-900 border border-amber-400 shadow" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 mb-1">
                STEP 3. 間の相手の石が一気に大反転！
              </div>
              <p className="text-slate-300 text-[11px]">
                普通のオセロのように、<strong>間にある相手の石がすべて自分の色にひっくり返ります！</strong>
                離れた場所に2×2を作って敵陣を挟み撃ちにする大逆転が可能です。
              </p>
            </div>
          </div>

          {/* 通常ルール補足 */}
          <p className="text-[11px] text-slate-400 text-center">
            ※もちろん、通常の1マス単位のオセロルール（挟んだ石を裏返す）も通常通り行われます。
          </p>
        </div>

        {/* スタートボタン */}
        <div className="mt-5 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] transition cursor-pointer shadow-md shadow-amber-400/20"
          >
            対局を始める
          </button>
        </div>
      </div>
    </div>
  );
};
