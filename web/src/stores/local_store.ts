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
  get unverifiedUserId() {
    return this.storage.getItem("unverified_user_id");
  }
  set unverifiedUserId(value: string | null) {
    this.storage.setItem("unverified_user_id", value);
  }
}
export const ijiaLocalStorage = new IjiaLocalStorage();
