import { REQUEST_AUTH_KEY } from "@/api.ts";
import Cookie from "js-cookie";

class CookieStore {
  private get(key: string) {
    return Cookie.get(key);
  }
  private set(key: string, value: string) {
    return Cookie.set(key, value);
  }
  private remove(key: string) {
    return Cookie.remove(key);
  }
  set accessToken(value: string | undefined) {
    if (value) {
      this.set(REQUEST_AUTH_KEY, value);
    } else {
      this.remove(REQUEST_AUTH_KEY);
    }
  }
  get accessToken(): string | undefined {
    return this.get(REQUEST_AUTH_KEY);
  }
}

export const ijiaCookie = new CookieStore();
