import { HelpCircle, BarChart2, ArrowUpDown, Ticket, ThumbsUp } from "lucide-react";

export function TicketFeatureDescription() {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-bpim-border bg-bpim-surface/40 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-bpim-border pb-4">
        <HelpCircle className="h-5 w-5 text-bpim-primary" />
        <h3 className="text-base font-bold text-bpim-text">機能について</h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-bpim-primary" />
            <h4 className="text-sm font-bold text-bpim-text">この機能でできること</h4>
          </div>
          <p className="text-xs leading-relaxed text-bpim-muted">
            ランダムレーンチケットの番号（＝レーン配置パターン）を入力すると、そのパターンが各楽曲においてどれほど「当たり」に近いかをスコアリングし、使用先をレコメンドします。
          </p>
          <p className="text-xs leading-relaxed text-bpim-muted">
            チケットはIIDX公式サイト上でBPIMブックマークレットを実行することで一括取得できます。
            <br />
            (詳細は上の「ブックマークレット経由で登録」から設定してください。)
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-bpim-primary" />
            <h4 className="text-sm font-bold text-bpim-text">スコア表示モードの使い分け</h4>
          </div>
          <ul className="flex flex-col gap-3">
            <li className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-bpim-text">
                配置スコア（絶対値）― とにかく押しやすい譜面でやりたいとき
              </span>
              <span className="text-[11px] leading-relaxed text-bpim-muted">
                各楽曲における「この配置がどれだけ押しやすいか」の絶対的なスコアです。
                このモードでは<span className="text-bpim-text font-semibold">楽曲をまたいで純粋に押しやすさで比較</span>できます。
                「このチケットで一番快適にプレーできる曲に使いたい」場合に向いています。
              </span>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-bpim-text">
                当たり譜面度（%）― チケットが希少価値の高い譜面を探したいとき
              </span>
              <span className="text-[11px] leading-relaxed text-bpim-muted">
                その楽曲の最高配置を100%として、このチケットが何%に相当するかを示します。
                <span className="text-bpim-text font-semibold">「この楽曲でこのレーン配置が来ること自体が貴重」</span>な曲を発見するのに向いています。
                配置スコアの絶対値は低くても、その楽曲では珍しく良い配置という場合に高い値になります。
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-bpim-primary" />
            <h4 className="text-sm font-bold text-bpim-text">ソート順の使い分け</h4>
          </div>
          <ul className="flex flex-col gap-2">
            {[
              {
                label: "当たり譜面度順",
                desc: "そのチケットで最も「良い配置」になる楽曲を優先します。純粋にパターンの良さで選びたいときに使います。",
              },
              {
                label: "BPI差が大きい順",
                desc: "現在の総合BPIと単曲BPIの差が大きい（＝引き上げ余地が大きい）楽曲を優先します。総合BPIを効率よく伸ばしたいときに使います。",
              },
              {
                label: "スコア（BPI）順",
                desc: "現在の単曲BPIが高い楽曲を優先します。すでにスコアが高い曲でさらに詰めたいときに使います。",
              },
            ].map(({ label, desc }) => (
              <li key={label} className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-bpim-text">{label}</span>
                <span className="text-[11px] leading-relaxed text-bpim-muted">{desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-bpim-primary" />
            <h4 className="text-sm font-bold text-bpim-text">投票について</h4>
          </div>
          <p className="text-xs leading-relaxed text-bpim-muted">
            各楽曲カードの 👍 / 👎 ボタンをクリックして、そのパターンが押しやすいかそうでないか投票できます。
            <br />
            ※投票結果はスコアリングの精度向上に役立てられます。
          </p>
          <p className="text-xs leading-relaxed text-bpim-muted">
            投票にはログインが必要です。同じパターンにもう一度投票すると取り消しになります。
          </p>
        </div>
      </div>

      <p className="border-t border-bpim-border pt-4 text-[11px] text-bpim-muted">
        ※スコアリングは当サイトの独自アルゴリズムによるもので、実際のプレー感覚とは異なる場合があります。本機能はベータ版のため、今後スコアリング方法が変更される可能性があります。
      </p>
    </div>
  );
}
