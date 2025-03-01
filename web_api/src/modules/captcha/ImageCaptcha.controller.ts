import { ImageCaptchaQuestion, ImageCaptchaReply } from "./Captcha.type.ts";
import { captcha_picture, DbCaptchaPicture } from "@ijia/data/db";
import { getDbPool, v } from "@ijia/data/yoursql";
import fs from "node:fs/promises";
import { Get, Post } from "@/hono-decorator/src/Router.ts";
import { PipeInput } from "@/hono-decorator/src/base.ts";
import { HTTPException } from "hono/http-exception";
import { SessionManager } from "./_SessionManage.ts";
import { autoBody } from "@/global/pipe.ts";

@autoBody
class ImageCaptchaController {
  readonly imageCaptcha = new SessionManager<ImageCaptchaSession>("Captcha:image", 5 * 60);

  private async imageCreateSessionData(): Promise<ImageCaptchaSession> {
    const select = captcha_picture.select({
      id: true,
      type: true,
      is_true: true,
    });
    //TODO: 优化随机行的获取
    //4 张确定值
    const certain = select.where(`is_true IS NOT NULL`).orderBy("RANDOM()").limit(4);
    //5 张不确定值
    const equivocal = select.where(`is_true IS NULL`).orderBy("RANDOM()").limit(5);

    const sql = `${certain.toSelect()} UNION ${equivocal.toSelect()}`;
    const result = await getDbPool().queryRows<Pick<DbCaptchaPicture, "id" | "is_true" | "type">>(sql);
    const answer: (boolean | null)[] = new Array(result.length);
    const allIdList: string[] = new Array(result.length);
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      allIdList[i] = item.id;
      answer[i] = item.is_true;
    }
    return {
      answers: answer,
      allIdList,
    };
  }
  private async imageUrlToId(imageUrl: string): Promise<string | null> {
    let i = imageUrl.indexOf("-");
    if (i < 0) throw new Error("错误的 url");

    const sessionId = imageUrl.slice(0, i);
    const index = Number.parseInt(imageUrl.slice(i + 1));
    if (!Number.isInteger(index)) throw new Error("错误的 url");

    const session = await this.imageCaptcha.get(sessionId);
    if (!session) return null;

    const imageId = session.allIdList[index];
    if (!imageId) throw new Error("url不存在");

    return imageId;
  }
  async getAnswer(sessionId: string) {
    const data = await this.imageCaptcha.get(sessionId);
    if (!data) throw new Error("id 不存在");
    const answers = data.answers;
    const yes: number[] = [];
    const unknown: number[] = [];
    const no: number[] = [];
    for (let i = 0; i < answers.length; i++) {
      if (answers[i] === null) unknown.push(i);
      else if (answers[i]) yes.push(i);
      else no.push(i);
    }
    return {
      yes,
      no,
      all: data.allIdList,
      unknown,
    };
  }

  @PipeInput((ctx) => ctx.req.query("sessionId"))
  @Post("/captcha/image")
  async createSession(sessionId?: string): Promise<ImageCaptchaQuestion> {
    const data = await this.imageCreateSessionData();
    sessionId = await this.imageCaptcha.set(data, { sessionId });
    return {
      sessionId,
      imageUrlList: data.allIdList.map((imageId) => sessionId + "-" + imageId),
      survivalTime: this.imageCaptcha.expire,
    };
  }
  private async imageVerifyOnly(sessionId: string, selectedIndex: number[], notDelete?: boolean) {
    const cache = await this.imageCaptcha.take(sessionId);
    if (!cache) return false;
    const { allIdList, answers } = cache;

    const needSelect = new Set<number>();
    const unknown = new Set<number>();
    for (let i = 0; i < answers.length; i++) {
      if (answers[i] === null) unknown.add(i);
      else if (answers[i]) needSelect.add(i);
    }

    const selectedSet = new Set<number>();
    for (const index of selectedIndex) {
      let answer = answers[index];
      if (answer === false) return false;
      needSelect.delete(index);
      selectedSet.add(index);
    }
    if (needSelect.size) return false;

    const assertCorrect = new Set<string>();
    const assertError = new Set<string>();
    for (const index of unknown) {
      if (selectedSet.has(index)) {
        assertCorrect.add(allIdList[index]);
      } else {
        assertError.add(allIdList[index]);
      }
    }

    return {
      assertCorrect,
      assertError,
    };
  }
  async verify(reply: ImageCaptchaReply): Promise<boolean> {
    const pass = await this.imageVerifyOnly(reply.sessionId, reply.selectedIndex);
    if (pass) {
      const assertCorrect = Array.from(pass.assertCorrect);
      const assertError = Array.from(pass.assertError);
      const add = captcha_picture
        .update({ yes_count: "yes_count + 1" })
        .where(`id in (${assertCorrect.map((value) => v(value)).join(",")})`);
      const sub = captcha_picture
        .update({ no_count: "no_count + 1" })
        .where(`id in (${assertError.map((value) => v(value)).join(",")})`);

      if (assertCorrect.length && assertError.length) {
        await using q = getDbPool().begin();
        await q.query(add);
        await q.query(sub);
        await q.commit();
      } else if (assertCorrect.length) {
        await add.query();
      } else if (assertError.length) {
        await sub.query();
      }
    }
    return !!pass;
  }

  @PipeInput(function (ctx) {
    return ctx.req.param("url");
  })
  @Get("/captcha/image/:url")
  async getCaptchaImageStream(imageUrl: string) {
    const imageId = await this.imageUrlToId(imageUrl).catch(() => null);
    if (!imageId) throw new HTTPException(404);

    const fd = await fs.open(imageId);
    return fd.readableWebStream({ type: "bytes" });
  }
}
export const imageCaptchaController = new ImageCaptchaController();

type ImageCaptchaSession = {
  answers: (boolean | null)[];
  allIdList: string[];
};
