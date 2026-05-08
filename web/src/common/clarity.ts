import clarity from "@microsoft/clarity";
import { ijiaLocalStorage } from "@/stores/local_store.ts";
import { IS_ONLINE_HOSTNAME } from "./env.ts";

type Clarity = typeof import("@microsoft/clarity").default;
const Clarity: typeof import("@microsoft/clarity").default = clarity as any;
export { Clarity };

const projectId = "r86thpb6rm";

let isClarityEnabled = false;
export function initClarity() {
  if (typeof window !== "undefined" && IS_ONLINE_HOSTNAME) {
    try {
      enabledTrack();
      console.log("Clarity enabled");
    } catch (error) {
      console.error("Clarity init failed", error);
    }
  }
}
export function setIdentify(userId: string | null) {
  if (!isClarityEnabled) return;
  try {
    Clarity.identify(userId ? "ijia-" + userId : "guest");
  } catch (e) {
    console.error("设置Clarity用户信息失败", e);
  }
}
function enabledTrack() {
  isClarityEnabled = true;
  Clarity.init(projectId);
  const userId = ijiaLocalStorage.unverifiedUserId;
  if (userId !== null) {
    setIdentify(userId);
  }
}
