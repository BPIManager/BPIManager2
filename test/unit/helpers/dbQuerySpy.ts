import { vi } from "vitest";

export interface RecordedCall {
  method: string;
  args: unknown[];
}

/**
 * Kyselyのクエリビルダーを模したチェーン可能なスパイを作成する。
 *
 * `where`/`orderBy`/`select` 等どんなメソッド呼び出しも記録しつつ自身を返し、
 * `execute`系メソッドだけ指定した結果を解決するPromiseを返す。
 * コールバック引数(join/where等の関数)は記録するだけで実行はしない。
 */
export function createQueryBuilderSpy(result: unknown = []) {
  const calls: RecordedCall[] = [];

  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      return (...args: unknown[]) => {
        calls.push({ method: prop, args });
        if (
          prop === "execute" ||
          prop === "executeTakeFirst" ||
          prop === "executeTakeFirstOrThrow"
        ) {
          return Promise.resolve(result);
        }
        return proxy;
      };
    },
  };

  const proxy = new Proxy({}, handler);
  return { proxy, calls };
}

/**
 * `db`インスタンス全体をスパイに置き換える。
 * `db.selectFrom(...)` 等どのエントリーポイントを呼んでも同じチェーンスパイに繋がる。
 *
 * @param result - `execute`系メソッドが解決する値
 */
export function createDbSpy(result: unknown = []) {
  const { proxy: chain, calls } = createQueryBuilderSpy(result);

  const dbHandler: ProxyHandler<object> = {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      return vi.fn((...args: unknown[]) => {
        calls.push({ method: prop, args });
        return chain;
      });
    },
  };

  const db = new Proxy({}, dbHandler);
  return { db, calls };
}

/** callsの中から指定メソッド名の呼び出しをすべて取得する */
export function callsFor(calls: RecordedCall[], method: string) {
  return calls.filter((c) => c.method === method);
}
