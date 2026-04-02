import {
  HelpCircle,
  History,
  Lightbulb,
  Save,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const OptimizerGuide = () => (
  <Accordion type="single" collapsible className="w-full mt-4">
    <AccordionItem
      value="guide"
      className="border border-bpim-border bg-bpim-surface/50 rounded-xl px-4 overflow-hidden"
    >
      <AccordionTrigger className="text-sm font-bold text-bpim-muted hover:text-bpim-text py-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-bpim-primary" />
          この機能の使い方
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6 space-y-6 text-bpim-text">
        <section className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-bpim-primary flex items-center gap-2">
            <Target className="h-3.5 w-3.5" /> Concept
          </h4>
          <p className="text-xs leading-relaxed text-bpim-muted">
            このツールは、
            <b>
              「どの曲をあと何点伸ばせば、効率よく目標の総合BPIに到達できるか」
            </b>
            を逆算してあなた専用の強化メニューを作成します。
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-bpim-subtle">
              設定のポイント
            </h4>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">最短経路 vs フレキシブル</p>
                  <p className="text-[11px] text-bpim-muted leading-snug">
                    <b>最短経路</b>
                    は1曲あたりのノルマが高くなりますが、少ない曲数で目標に届きます。
                    <b>フレキシブル</b>
                    は指定した楽曲数を目安として多くの曲に目標を分散させるため、1曲あたりの負担が軽く、地道な成長を目指したい方に向いています。
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <Star className="h-4 w-4 text-bpim-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">
                    得意曲を伸ばす（レーダー優先）
                  </p>
                  <p className="text-[11px] text-bpim-muted leading-snug">
                    あなたの「武器（得意属性）」を分析し、平均よりスコアが低い楽曲を優先的に抽出します。自分の強みを活かして効率よく数値を盛りたい場合に最適です。
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <TrendingUp className="h-4 w-4 text-bpim-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">
                    現在の総合BPIを考慮して算出する
                  </p>
                  <p className="text-[11px] text-bpim-muted leading-snug">
                    ONにすると、各曲の目標BPIが「現在の総合BPIを考慮して現実的に到達可能なライン」を上限に制限されます。現在のスキルに見合った無理のないメニューが生成されるため、実際に達成しやすい計画を立てたい場合に有効です。OFFにすると上限なしで計算するため、挑戦的な目標値が出ることがあります。(プレイ楽曲数が少なく、総合BPIが実力に見合っていないときにご利用ください)
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-bpim-subtle">
              結果の見方
            </h4>
            <div className="bg-bpim-bg p-3 rounded-lg border border-bpim-border space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-full bg-bpim-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-bpim-primary w-2/3" />
                </div>
                <span className="text-[10px] font-bold shrink-0">Impact</span>
              </div>
              <p className="text-[11px] text-bpim-muted leading-snug">
                カード内の青いゲージは<b>「総合BPIへの貢献度」</b>
                です。このゲージが長い曲ほど、クリアした際の総合BPIの伸びが大きくなります。
              </p>
            </div>
          </section>
        </div>

        <section className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-bpim-primary flex items-center gap-2">
            <Save className="h-3.5 w-3.5" /> プランの保存
          </h4>
          <p className="text-xs leading-relaxed text-bpim-muted">
            計算結果の右上にある
            <b>「結果を保存」</b>
            ボタンを押すと、現在の強化メニューをサーバーに保存できます。保存したプランはページ下部の
            <b>「保存済みのプラン」</b>
            セクションに一覧表示され、クリックするといつでも結果を呼び出せます。不要になったプランはゴミ箱アイコンから削除できます。
          </p>
          <div className="bg-bpim-bg border border-bpim-border rounded-lg p-3 flex items-start gap-2 mt-1">
            <History className="h-3.5 w-3.5 text-bpim-muted shrink-0 mt-0.5" />
            <p className="text-[11px] text-bpim-muted leading-snug">
              目標BPIごとに複数のプランを保存しておくことで、段階的な成長計画を管理できます。
            </p>
          </div>
        </section>

        <div className="bg-bpim-primary/5 border border-bpim-primary/20 rounded-lg p-4 flex gap-3">
          <Lightbulb className="h-5 w-5 text-bpim-primary shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-bpim-primary">
              おすすめの設定
            </p>
            <p className="text-[11px] text-bpim-muted leading-relaxed">
              まずは
              <b>「目標BPIを現在+1.0」「曲数を30曲」「フレキシブルモード」</b>
              で計算してみてください。
              計算するたびに結果が少しずつ変わるため、何度か試して「これなら届きそう」と思えるメニューを見つけて練習メニューに加えましょう！
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);
