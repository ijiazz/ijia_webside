import { autoBody } from "@/global/pipe.ts";
import { Get, Post } from "@asla/hono-decorator";

@autoBody
export class NoticeController {
  @Post("/notice/switchLiveWatch")
  switchLiveWatch() {}
}
