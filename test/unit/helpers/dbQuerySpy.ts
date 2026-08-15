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
export function createQueryBuilderSpy(result: unknown) {
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
        // Kysely実物の$callは`func(this)`を呼びその戻り値を返す。呼び出し元が
        // $call経由で追加したwhere等の呼び出しもcallsに記録されるようにするため、
        // モックでも実際にコールバックを実行する(他のコールバック引数メソッド
        // ($if等)は分岐条件の評価が必要でモック側では判定できないため対象外)。
        if (prop === "$call" && typeof args[0] === "function") {
          return args[0](proxy);
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
export function createDbSpy(result: unknown) {
  const { proxy: chain, calls } = createQueryBuilderSpy(result);

  // db.fn.max(...)のようなトップレベルの関数ビルダーアクセスに対応する
  const fnHandler: ProxyHandler<object> = {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      return (...args: unknown[]) => {
        calls.push({ method: `fn.${prop}`, args });
        return chain;
      };
    },
  };
  const fnProxy = new Proxy({}, fnHandler);

  const dbHandler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "fn") return fnProxy;
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

  // db.fn.max(...)/trx.fn.max(...)のようなトップレベルの関数ビルダーアクセスに対応する
  const fnHandler: ProxyHandler<object> = {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      return (...args: unknown[]) => {
        calls.push({ method: `fn.${prop}`, args });
        return trx;
      };
    },
  };
  const fnProxy = new Proxy({}, fnHandler);

  // directProxy自身のcallsもtrxと同じ配列に集約する
  const directHandler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "fn") return fnProxy;
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
      if (prop === "fn") return fnProxy;
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
