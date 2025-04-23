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
  set jwtToken(value: string | undefined) {
    if (value) {
      this.set("jwt-token", value);
    } else {
      this.remove("jwt-token");
    }
  }
  get jwtToken(): string | undefined {
    return this.get("jwt-token");
  }

  get securityToken(): string | undefined {
    return this.get("security_token");
  }
  set securityToken(value: string | undefined) {
    if (value) {
      this.set("security_token", value);
    } else {
      this.remove("security_token");
    }
  }
}

export const ijiaCookie = new CookieStore();
