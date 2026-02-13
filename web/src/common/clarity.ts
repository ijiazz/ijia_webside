import clarity from "@microsoft/clarity";
import { ijiaLocalStorage } from "@/stores/local_store.ts";

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
export function setIdentify(userId: string | null) {
  Clarity.identify(userId ? "ijia-" + userId : "guest");
}
function enabledTrack() {
  Clarity.init(projectId);
  const userId = ijiaLocalStorage.unverifiedUserId;
  setIdentify(userId);
}
