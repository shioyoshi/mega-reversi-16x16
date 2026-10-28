import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl p-6 shadow-2xl text-slate-100 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📜</span>
            <div>
              <h2 className="text-xl font-bold font-display text-white">
                16×16 メガオセロ 特別ルール説明
              </h2>
              <p className="text-xs text-slate-400">
                広大な16×16盤面と「2×2ブロック挟み込み」の新感覚リバーシ！
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

        <div className="space-y-4 text-xs leading-relaxed text-slate-300 max-h-[65vh] overflow-y-auto pr-1">
          {/* 基本ルール */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <span>⚪⚫</span>
              <span>1. 基本ルール（通常のオセロルール）</span>
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>盤面は通常の4倍の広さとなる <strong>16×16 (計256マス)</strong> です。</li>
              <li>相手の石を自色の石で挟むと、その間にある石が自分の色に裏返ります。</li>
              <li>縦・横・斜めの8方向すべてで挟み込みが有効です。</li>
              <li>打てる場所がない時は自動的にパスとなります。両者打てなくなったら対局終了です。</li>
            </ul>
          </div>

          {/* 特別ルール: 2x2 ブロック挟み込み */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 rounded-2xl border border-amber-500/30">
            <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
              <span>⚡</span>
              <span>2. 【特別ルール】2×2 ブロック挟み込み（メガ反転）</span>
            </h3>
            <div className="space-y-2 text-slate-300">
              <p>
                盤面は縦横1/8ずつ、<strong>「2×2の4マス区画」が合計64個 (8×8)</strong> 配置されています。
                金色の太枠で区切られているのがこの「2×2ブロック」です。
              </p>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-500/20 space-y-1.5">
                <div className="font-bold text-amber-300 text-xs">
                  🔥 メガ反転の発動条件：
                </div>
                <p className="text-[11px] text-slate-400">
                  いずれかの 2×2 ブロックの <strong>4マスすべてが同じ色（同色完成ブロック）</strong> になった時！
                </p>
                <p className="text-[11px] text-slate-400">
                  その完成ブロックから縦・横・斜めの方向に、相手の石が存在するブロックを挟んで、
                  その先の直線上に <strong>同じ色の別の完成ブロック</strong> が存在した場合…
                </p>
                <p className="text-xs font-black text-amber-400 pt-1">
                  👉 間にあるすべてのブロック内の相手の石が一気に自色へ大反転します！
                </p>
              </div>
            </div>
          </div>

          {/* 戦略のコツ */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
              <span>💡</span>
              <span>3. 勝利への戦略のヒント</span>
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>
                <strong>2×2の要塞を固めろ</strong>: 4マスを同色にして完成ブロックを作ると、相手のメガ反転を防ぐ防壁になり、同時に強力な反撃の砲台になります！
              </li>
              <li>
                <strong>ラインを狙え</strong>: 同色の完成ブロックを離れた位置に2つ作ると、その一直線上にある敵ブロックを一網打尽にする「メガリバーサル」が炸裂します！
              </li>
              <li>
                <strong>四隅（コーナー）は超重要</strong>: 四隅の 2×2 ブロックを制覇したプレイヤーは盤面を圧倒的に支配できます。
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-lg shadow-amber-500/25 transition cursor-pointer text-xs"
          >
            ルールを理解してプレイ開始！
          </button>
        </div>
      </div>
    </div>
  );
};
