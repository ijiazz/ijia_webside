import clarity from "@microsoft/clarity";
import { getUserInfoFromToken } from "./common/user.ts";

type Clarity = typeof import("@microsoft/clarity").default;
const Clarity: typeof import("@microsoft/clarity").default = clarity as any;
export { Clarity };

const projectId = "r86thpb6rm";
if (import.meta.env.PROD) {
  if (typeof window !== "undefined" && location.hostname === "ijiazz.cn") {
    try {
      enabledTrack();
      console.log("Clarity enabled");
    } catch (error) {
      console.error("Clarity init failed", error);
    }
  }
}
function enabledTrack() {
  Clarity.init(projectId);
  const user = getUserInfoFromToken();
  Clarity.identify(user ? "ijia-" + user.userId.toString() : "guest");
}
