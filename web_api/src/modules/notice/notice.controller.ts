import { autoBody } from "@/global/pipe.ts";
import { Get, Post } from "@/hono-decorator/src/Router.ts";

@autoBody
export class NoticeController {
  @Post("/notice/switchLiveWatch")
  switchLiveWatch() {
    
  }
}
