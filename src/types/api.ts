/**
 * API v2 共通レスポンスエンベロープの型。全エンドポイントの共通形状を1箇所で定義する（docs/decisions/0009-api-v2-common-envelope.md）。
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
 * ビジネスロジックのハンドラが返す正規化結果。res へは直接書かず、v1/v2 アダプタ（apiResult.ts）が書き込む。
 */
export type HandlerResult<T> =
  | { ok: true; body: T; meta?: Partial<ApiMeta> }
  | { ok: false; status: number; message: string };
