const GLOBAL_PREFIX = "IJIA_SCHOOL_";

export class PrefixStorage {
  constructor(
    private store: Storage,
    private prefix: string,
  ) {
    this.prefix = GLOBAL_PREFIX + prefix;
  }
  getItem(key: string): string | null {
    if (!key) return null;
    return this.store.getItem(this.prefix + key);
  }
  setItem(key: string, value: string): void {
    if (!key) return;
    this.store.setItem(this.prefix + key, value);
  }
  removeItem(key: string): void {
    if (!key) return;
    return this.store.removeItem(this.prefix + key);
  }
}
