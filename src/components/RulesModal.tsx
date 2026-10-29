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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-neutral-100 my-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              {isFirstVisit ? '16×16 オセロ 特別ルール' : '特別ルールの解説'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              通常のオセロルール ＋ 2×2ブロック挟み込み機能
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg p-1.5 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* 3ステップ図解 (モノトーン) */}
        <div className="space-y-3.5 text-xs leading-relaxed">
          {/* STEP 1: 2x2 ブロックを揃える */}
          <div className="bg-neutral-950 rounded-xl p-3.5 border border-neutral-800 flex items-center gap-4">
            <div className="shrink-0 w-16 h-16 bg-[#008f00] border border-[#005e00] rounded-lg p-1 grid grid-cols-2 grid-rows-2 gap-1 shadow-inner">
              <div className="bg-neutral-900 rounded-full border border-neutral-700 shadow-sm" />
              <div className="bg-neutral-900 rounded-full border border-neutral-700 shadow-sm" />
              <div className="bg-neutral-900 rounded-full border border-neutral-700 shadow-sm" />
              <div className="bg-neutral-900 rounded-full border border-neutral-700 shadow-sm" />
            </div>
            <div>
              <div className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                <span>STEP 1. 縦横1/8の「2×2マス」を同色で制覇！</span>
              </div>
              <p className="text-neutral-300 text-[11px]">
                盤面は2×2（計64区画）に区切られています。
                この4マスすべてを同じ色で埋めると<strong>【完成ブロック】</strong>になります。
              </p>
            </div>
          </div>

          {/* STEP 2: 別の完成ブロックで挟む */}
          <div className="bg-neutral-950 rounded-xl p-3.5 border border-neutral-800 flex items-center gap-4">
            <div className="shrink-0 w-16 h-16 bg-[#008f00] border border-[#005e00] rounded-lg p-1.5 flex flex-col justify-between items-center shadow-inner">
              <div className="w-4 h-4 rounded-full bg-neutral-900 border border-neutral-700" />
              <div className="w-3.5 h-3.5 rounded-full bg-white border border-neutral-300 animate-pulse" />
              <div className="w-4 h-4 rounded-full bg-neutral-900 border border-neutral-700" />
            </div>
            <div>
              <div className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block" />
                <span>STEP 2. 直線上に別の「完成ブロック」があると…</span>
              </div>
              <p className="text-neutral-300 text-[11px]">
                縦・横・斜めの直線上に、同じ色の完成ブロックがもう1つ存在し、その間に相手の石がある場合…
              </p>
            </div>
          </div>

          {/* STEP 3: 一網打尽に大反転 */}
          <div className="bg-neutral-950 rounded-xl p-3.5 border border-neutral-700 flex items-center gap-4">
            <div className="shrink-0 w-16 h-16 bg-[#008f00] border border-white/60 rounded-lg p-1.5 flex flex-col justify-between items-center shadow-inner">
              <div className="w-4 h-4 rounded-full bg-neutral-900 border border-white/80 shadow" />
              <div className="w-4 h-4 rounded-full bg-neutral-900 border border-white/80 shadow transition-all duration-300" />
              <div className="w-4 h-4 rounded-full bg-neutral-900 border border-white/80 shadow" />
            </div>
            <div>
              <div className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                <span>STEP 3. 間の相手の石が一気に大反転！</span>
              </div>
              <p className="text-neutral-300 text-[11px]">
                普通のオセロのように、<strong>間にある相手の石がすべて自分の色にひっくり返ります！</strong>
                新しく2×2を揃えた瞬間だけ発動する大逆転のチャンスです。
              </p>
            </div>
          </div>

          {/* 通常ルール補足 */}
          <p className="text-[11px] text-neutral-400 text-center pt-1">
            ※通常の1マス単位のオセロルール（挟んだ石を裏返す）も通常通り行われます。
          </p>
        </div>

        {/* スタートボタン (白背景×黒文字の高コントラスト) */}
        <div className="mt-5 pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-black bg-white hover:bg-neutral-200 active:scale-[0.99] transition cursor-pointer shadow-md"
          >
            対局を始める
          </button>
        </div>
      </div>
    </div>
  );
};
