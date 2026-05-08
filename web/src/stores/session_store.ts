import { PrefixStorage } from "./_browser-stores.ts";

class IjiaSessionStorage {
  private sessionStorage = new PrefixStorage(globalThis.sessionStorage, "IJIA_SCHOOL_");
  constructor() {}

  get emailAuthToken() {
    return this.sessionStorage.getItem("email_auth_token");
  }
  set emailAuthToken(value: string | null) {
    this.sessionStorage.setItem("email_auth_token", value);
  }
  get lastReloadTime() {
    const timeStr = this.sessionStorage.getItem("last_reload_time");
    if (timeStr) {
      const time = parseInt(timeStr);
      if (Number.isInteger(time)) {
        return time;
      }
    }
    return null;
  }
  set lastReloadTime(value: number | null) {
    this.sessionStorage.setItem("last_reload_time", value?.toString() ?? null);
  }
}
export const ijiaSessionStorage = new IjiaSessionStorage();
