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
}
export const ijiaSessionStorage = new IjiaSessionStorage();
