# コーディング規約（全般）

- コンポーネントはデフォルトエクスポート、型はnamed export
- スタイルはTailwind CSS v4のユーティリティクラス（`globals.css` はほぼ空）。数値がキャノニカルなスペーシングスケールに乗る場合、`h-[30px]`のような任意値記法ではなく`h-7.5`のようなキャノニカルクラスを使う（`px`値を4で割った数値がそのままクラス名になる）。スペーシングスケールに乗らない値（フォントサイズ・色等）は任意値記法のままでよい
- UI部品はshadcn/ui (`src/components/ui/`)を優先利用
- SWRフックは `src/hooks/[ドメイン]/` に配置、フェッチャーは `src/services/swr/` に分離
- `src/constants/radars/topElements.json` (~95KB) は大きいので直接読まない
