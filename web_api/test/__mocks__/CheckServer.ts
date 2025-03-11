import { CheckServer } from "@/services/douyin.ts";
import { vi } from "vitest";
function noImpl(): never {
  throw new Error("未实现");
}
export class MockCheckServer extends CheckServer {
  constructor() {
    super("12", "http://127.0.0.1");
  }
  override checkUserBind = vi.fn<CheckServer["checkUserBind"]>(noImpl);
  override getDouYinUserInfo = vi.fn<CheckServer["getDouYinUserInfo"]>(noImpl);
  override userIsLive = vi.fn<CheckServer["userIsLive"]>(noImpl);
}
