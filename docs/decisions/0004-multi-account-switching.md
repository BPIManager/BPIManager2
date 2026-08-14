# 0004: 複数アカウント切り替え機能のクレデンシャル保持方式

- **ステータス**: 採用
- **記録日**: 2026-08-14
- **対応issue**: #269

## 背景

複数のBPIMアカウント（Google/Twitter/LINEなどOAuthプロバイダ経由で作成した別アカウント）を保有するユーザーが、都度サインアウト→サインインし直すことなく切り替えられるようにしたい。

現在の認証実装（`src/lib/firebase/auth.ts`, `src/contexts/users/UserContext.tsx`）はFirebase Authのデフォルト挙動（`getAuth()`単一インスタンス、`browserLocalPersistence`、`onAuthStateChanged`）に依存しており、サーバー側セッションは持たずクライアントが毎回`getIdToken()`で取得した短命IDトークンをAPIに付与するステートレス方式。Firebase UIDはDBの`users.userId`と1:1で対応している。

Firebase Authは1つの`Auth`インスタンスにつき`currentUser`を1人しか保持できず、「複数アカウントを同時にログイン状態で保持し、再認証なしで瞬時に切り替える」標準機能を提供していない。

## 検討した選択肢

| 案 | 概要 |
|---|---|
| A: 複数Firebase Appインスタンス方式 | `initializeApp(config, name)`をアカウント数分呼び、各アカウントを別々の`Auth`インスタンス・別々のIndexedDB永続化領域で同時にログイン状態のまま保持する。切り替えは再認証不要で瞬時。実装・状態管理が複雑になり、複数アカウント分の生きたリフレッシュトークンが同時にブラウザ内に存在するため、XSS等が発生した場合の影響範囲が相対的に大きい |
| B: アカウント一覧記憶＋都度再認証方式 | 過去にサインインしたアカウントの一覧（uid・表示名・プロバイダ種別など）のみをlocalStorageに保持し、実際のFirebase Authセッションは常に1つだけ。切り替え選択時は該当プロバイダで`signInWithPopup`/`signInWithRedirect`を再実行する。Google/Twitterはブラウザに有効なOAuthセッションが残っていれば体感ほぼ瞬時、LINEは毎回リダイレクトを挟む。実装は既存のログインフロー（`authActions`, `LoginDialog`）をそのまま流用でき、同時に生存するトークンは常に1つのためセキュリティ面でも保守的 |

## 結論

B案（アカウント一覧記憶＋都度再認証方式）を採用する。

- アカウント一覧（uid・displayName・avatarUrl・provider・lastSwitchedAt）はlocalStorageに保持し、Firebase Authの認証情報（IDトークン・リフレッシュトークン）自体は現在ログイン中の1アカウント分のみをブラウザに保持する
- 既存のログイン実装（`src/lib/firebase/auth.ts`の`authActions`、`src/components/partials/modal/LoginDialog/`）を切り替え・新規アカウント追加の両方で流用し、新規のFirebase Appインスタンス管理は行わない
- 複数アカウントを同時にアクティブ状態で保持し再認証なしで切り替えるA案は、UX上の利点はあるがセキュリティ・実装コストの見合いから今回は不採用とする。将来的にニーズが強まった場合は別issueで再検討する
