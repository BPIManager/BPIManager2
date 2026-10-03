/**
 * モジュールスコープの Map による簡易メモリキャッシュ。TTL や有効性判定は用途ごとに異なるため持たず、呼び出し側が判断する。
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
