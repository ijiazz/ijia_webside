import { PrefixStorage } from "./_browser-stores.ts";

class IjiaLocalStorage {
  private storage = new PrefixStorage(globalThis.localStorage, "IJIA_SCHOOL_");
  constructor() {}
  get themeMode() {
    return this.storage.getItem("theme_mode");
  }
  set themeMode(value: string | null) {
    this.storage.setItem("theme_mode", value);
  }
}
export const ijiaLocalStorage = new IjiaLocalStorage();
