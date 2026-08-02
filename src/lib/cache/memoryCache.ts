/**
 * モジュールスコープのMapによる簡易メモリキャッシュの共通実装。
 *
 * TTLや有効性判定(日付比較・バージョン一致等)は用途ごとに異なるため
 * ここには持たず、呼び出し側が`get`の戻り値を見て判断する。
 */
export class MemoryCache<K, V> {
  private readonly store = new Map<K, V>();

  get(key: K): V | undefined {
    return this.store.get(key);
  }

  set(key: K, value: V): void {
    this.store.set(key, value);
  }

  clear(): void {
    this.store.clear();
  }
}
