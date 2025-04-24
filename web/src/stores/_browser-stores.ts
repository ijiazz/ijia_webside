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
  setItem(key: string, value: string | null): void {
    if (!key) return;
    if (value === null) {
      this.store.removeItem(this.prefix + key);
      return;
    }
    this.store.setItem(this.prefix + key, value);
  }
}
