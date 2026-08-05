# 0002: SWRフェッチャー分離規約(services/swr)の運用方針

- **ステータス**: 採用
- **記録日**: 2026-08-05
- **対応issue**: #251

## 背景

`coding-conventions.md`は「SWRフックは`src/hooks/[ドメイン]/`に配置、フェッチャーは`src/services/swr/`に分離する」と定めているが、実態としては`src/services/swr/`配下が`fetchStats.ts`・`useInfinite.ts`の2ファイルのみで、`useOfficialArenaHistory.ts`・`useEditProfile.ts`・`useFollow.ts`・`useAPIKey.ts`等の多数のフックがフェッチャーを内部に直接定義している。

## 検討した選択肢

| 案 | 概要 |
|---|---|
| A: 規約を撤廃し実態に合わせる | 小さなフェッチャーまで分離を強制する価値が薄いと判断し、規約自体を緩和・削除する |
| B: 既存フックを段階的にservices/swrへ移行する | 規約は維持し、既存フックのフェッチャーを段階的に`services/swr/`へ切り出していく |

## 結論

B案を採用。規約(`coding-conventions.md`のSWRフック配置ルール)は現状維持し、既存フックのフェッチャー内蔵箇所を段階的に`src/services/swr/`へ切り出す。移行は個別issueとして起票し、新規フックも規約に従ってフェッチャーを分離する。
