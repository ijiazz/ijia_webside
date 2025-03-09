import { getUrlByRouter } from "@/common/nav.ts";
import Cookie from "js-cookie";

export function logout() {
  Cookie.remove("jwt-token");
  location.href = getUrlByRouter("/passport/login");
}
