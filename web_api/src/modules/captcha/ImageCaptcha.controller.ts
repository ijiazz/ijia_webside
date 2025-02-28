import { ImageCaptchaQuestion, ImageCaptchaReply } from "./Captcha.type.ts";
import { captcha_picture, DbCaptchaPicture } from "@ijia/data/db";
import { getDbPool, v } from "@ijia/data/yoursql";
import fs from "node:fs/promises";
import { Get, Post } from "@/hono-decorator/src/Router.ts";
import { PipeInput } from "@/hono-decorator/src/base.ts";
import { HTTPException } from "hono/http-exception";
import { SessionManager } from "./_SessionManage.ts";

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
    const equivocal = select.where(`is_true IS NOT NULL`).orderBy("RANDOM()").limit(5);

    const result = await getDbPool().queryRows<Pick<DbCaptchaPicture, "id" | "is_true" | "type">>(
      `${certain.toString()} union ${equivocal.toString()}`,
    );
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
  private async imageVerifyOnly(sessionId: string, selectedIndex: number[]) {
    const cache = await this.imageCaptcha.get(sessionId);
    if (!cache) return false;
    const { allIdList, answers } = cache;

    const needSelect = new Set<number>();
    const unknown = new Set<string>();
    const canNot = new Set<number>();
    for (let i = 0; i < answers.length; i++) {
      if (answers[i] === null) unknown.add(allIdList[i]);
      else if (answers[i]) needSelect.add(i);
      else canNot.add(i);
    }

    for (const index of selectedIndex) {
      let answer = answers[index];
      if (answer === false) return false;
      needSelect.delete(index);
    }
    if (needSelect.size) return false;

    const assertCorrect = selectId;
    const assertError = unknownId.difference(selectId);
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
        .update({ yes: "yes+1" })
        .where(`id in (${assertCorrect.map((value) => v(value)).join(",")})`);
      const sub = captcha_picture
        .update({ no: "no+1" })
        .where(`id in (${assertError.map((value) => v(value)).join(",")})`);

      if (assertCorrect.length && assertError.length) {
        await using q = getDbPool().begin();
        await q.query(add);
        await q.query(sub);
        await q.commit();
      } else if (assertCorrect.length) {
        await add.query();
      } else if (assertError.length) {
        await add.query();
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
