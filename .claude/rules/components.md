---
paths:
  - "src/components/**"
---

# コンポーネント（`src/components/`）の規約

## `components/partials/` ディレクトリ構成

`partials/` 直下は役割ごとに4つのカテゴリに分かれている。新しいコンポーネントを追加するときは、まずどのカテゴリに属するかを判断してから配置する。

```
partials/
├── features/   # 特定の1ページからしか参照されないページ専用コンポーネント
├── common/     # 2つ以上のfeatures/ページから再利用される共有コンポーネント
├── modal/      # ダイアログ・モーダル系コンポーネント
└── shell/      # ページ全体の殻（認証ガード、レイアウト、プロフィール殻等）
```

- **features/**: 対応する`src/pages/`配下のページ1つからのみimportされる想定。他のfeatureや`common/`からimportされてはいけない
- **common/**: 複数のfeatureやshellから再利用されるコンポーネント。単一目的の小さいコンポーネントはそのまま`common/ComponentName/`、関連する複数コンポーネントをまとめる場合は`common/PurposeName/SubComponent/`のように目的名でラップする（例: `common/Auth/`, `common/Charts/`, `common/ListControls/`）
- **modal/**: `<Dialog>`等を伴うモーダル・ポップアップ系
- **shell/**: `RequireAuth`, `DashboardLayout`, `ProfileLayoutShell`など、ページの外枠・ゲート処理を担うコンポーネント
- あるコンポーネントが「features/にいるべきか、common/にいるべきか」迷ったら、実際にimportしている箇所を`grep`で確認し、自分のページ以外から参照されているかどうかで判断する

## `components/partials/` ファイル規則

各カテゴリの中でも、コンポーネントは**必ずフォルダ単位**で管理する。単体の `機能名.tsx` は作らない。

```
common/FeatureName/         # 機能名フォルダ（必須）
    ├── index.tsx         # ロジック含む（データフェッチ、状態管理等）
    ├── ui.tsx            # 純粋なUI関数のみ（副作用なし）
    ├── skeleton.tsx      # スケルトンUI（任意）
    └── errors.tsx        # エラー表示（任意）
```

- 共通化可能な汎用ロジックは `/utils` または `/services`、型定義は `/types` に格納
- UI のみのコンポーネントでも必ずフォルダを作り `index.tsx` に配置（`ui.tsx` に分離するかはロジックの有無で判断）
- この規則は主に「他の機能から再利用される独立したコンポーネント」を対象とする。あるフォルダの `index.tsx`/`ui.tsx` を読みやすくするために内部でのみ使う分割ファイル（例: `AdvancedFilter/BpmSection.tsx` のような private なセクション分割）はそのフォルダ内に置いてよく、個別にフォルダ化する必要はない
- 2つ以上のコンポーネントで見た目や構造(モーダルの殻、カードのレイアウト等)が重複したら、それらの最も近い共通の親フォルダ直下に共有プレゼンテーション用コンポーネントとして切り出し、差分だけを `children` / props で渡す。複数の**feature**をまたいで再利用される場合は `partials/` 直下や `common/` に、単一feature内の複数コンポーネントで再利用される場合はそのfeatureフォルダ直下に置く（例: `features/Import/`配下の複数モーダルで共有される`features/Import/ResultModalShell/`）

## Props設計

- 1つのコンポーネントが複数の独立した機能領域(タブ、セクション等)を扱う場合、フラットなpropsを並べるのではなく機能単位でオブジェクトにグルーピングする（例: `score: ScoreImportProps` / `tower: TowerImportProps`）。目安として1コンポーネントのpropsが10個を超えたらグルーピングを検討する
- グルーピングだけでは結合度は下がらない。グルーピング後もleaf数が多いなら、JSX上独立したセクションごとにコンポーネント分割を優先する
- Contextは複数箇所から参照される横断的な状態(認証ユーザー・ロケール・フィルタ等の既存Context群)に限定し、単一呼び出し元の親子間受け渡しには使わない
