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

/**
 * `db.transaction().execute(trx => ...)` パターンをスパイするdbを作成する。
 * `trx`側の呼び出しも`db`側と同じ`calls`配列に記録される。
 *
 * @param trxResult - `trx`のexecute系メソッドが解決する値(トランザクション内の
 *   select結果。複数selectがある場合は最初の呼び出し以外は同じ値を再利用する)
 * @param directResult - `db`から直接(トランザクションを介さず)呼ばれた場合の解決値
 */
export function createTransactionalDbSpy(
  trxResult: unknown = undefined,
  directResult: unknown = [],
) {
  const { proxy: trx, calls } = createQueryBuilderSpy(trxResult);
  // directProxy自身のcallsもtrxと同じ配列に集約する
  const directHandler: ProxyHandler<object> = {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      return (...args: unknown[]) => {
        calls.push({ method: prop, args });
        if (
          prop === "execute" ||
          prop === "executeTakeFirst" ||
          prop === "executeTakeFirstOrThrow"
        ) {
          return Promise.resolve(directResult);
        }
        return directProxy;
      };
    },
  };
  const directProxy = new Proxy({}, directHandler);

  const dbHandler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "transaction") {
        return vi.fn(() => ({
          execute: vi.fn(
            async (cb: (trx: unknown) => Promise<unknown>) => cb(trx),
          ),
        }));
      }
      if (typeof prop !== "string") return undefined;
      return vi.fn((...args: unknown[]) => {
        calls.push({ method: prop, args });
        return directProxy;
      });
    },
  };

  const db = new Proxy({}, dbHandler);
  return { db, trx, calls };
}
