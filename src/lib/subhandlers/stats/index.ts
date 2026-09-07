/**
 * stats ドメイン（`users/[userId]/stats/**`）の subhandler 群のバレル。
 * ルート側でクエリ検証（parseStatsQuery / parseQuery）とアクセス制御
 * （withUserApiHandler）を行い、各 handle* は検証済みクエリを受け取り
 * `HandlerResult` を返す。実体は責務ごとの分割ファイルにある。
 */
export * from "./charts";
export * from "./distributions";
export * from "./recommendations";
export * from "./arena";
export * from "./bpi";
export * from "./monthlyReview";
