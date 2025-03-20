import { CheckServer } from "@/services/douyin.ts";
import { vi } from "vitest";
function noImpl(): never {
  throw new Error("未实现");
}
export class MockCheckServer extends CheckServer {
  constructor() {
    super("12", "http://127.0.0.1");
  }
  override checkPlatformUserInfo = vi.fn<CheckServer["checkPlatformUserInfo"]>(noImpl);
  override syncUserInfo = vi.fn<CheckServer["syncUserInfo"]>(noImpl);
  override userIsLive = vi.fn<CheckServer["userIsLive"]>(noImpl);
}
