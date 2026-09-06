/**
 * API v2 共通レスポンスエンベロープの型定義。
 * 全エンドポイントで厳密に共通のレスポンス形状を持たせるための1箇所集約先。
 * 移行方式・背景は docs/decisions/0009-api-v2-common-envelope.md を参照。
 */

/** 一覧系エンドポイントのページネーション情報 */
export interface ApiPagination {
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
}

/** エンベロープのメタ欄。認証・アクセス制御由来の値と一覧系のページネーションを載せる */
export interface ApiMeta {
  /** 閲覧者のuserId（未ログインは null） */
  viewerId: string | null;
  /** 閲覧対象が閲覧者自身か */
  isSelf: boolean;
  /** 一覧系エンドポイントのページネーション情報（該当時のみ） */
  pagination?: ApiPagination;
}

/** `/api/v2/` 全エンドポイント共通のレスポンスエンベロープ */
export interface ApiResponse<T> {
  /** true のとき body は null、errorMessage は非 null */
  error: boolean;
  errorMessage: string | null;
  body: T | null;
  meta?: ApiMeta;
}

/**
 * ビジネスロジックのハンドラが返す正規化結果。
 * ハンドラは `res` に直接書き込まず本型を返し、実際の書き込みは
 * v1/v2 アダプタ（`src/middlewares/api/apiResult.ts`）が行う。
 */
export type HandlerResult<T> =
  | { ok: true; body: T; meta?: Partial<ApiMeta> }
  | { ok: false; status: number; message: string };
