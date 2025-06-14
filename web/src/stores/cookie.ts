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
      this.set("access_token", value);
    } else {
      this.remove("access_token");
    }
  }
  get accessToken(): string | undefined {
    return this.get("access_token");
  }
}

export const ijiaCookie = new CookieStore();
