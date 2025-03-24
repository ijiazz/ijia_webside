import { ImageCaptchaQuestion, ImageCaptchaReply } from "./captcha.dto.ts";
import { captcha_picture, DbCaptchaPicture } from "@ijia/data/db";
import { dbPool, v } from "@ijia/data/yoursql";
import { PipeInput, PipeOutput, Get, Post } from "@asla/hono-decorator";
import { HTTPException } from "hono/http-exception";
import { SessionManager } from "./_SessionManage.ts";
import { autoBody } from "@/global/pipe.ts";
import { getOSS, getBucket } from "@ijia/data/oss";
import { contentType } from "@std/media-types";
import path from "node:path";
import { ENV, RunMode } from "@/config.ts";
const BUCKET = getBucket();

@autoBody
class ImageCaptchaController {
  constructor() {
    if (ENV.MODE === RunMode.E2E) {
      console.log("E2E测试模式，验证码总是选择前 3 个图片");
    }
  }
  readonly imageCaptcha = new SessionManager<ImageCaptchaSession>("Captcha:image", 3 * 60);

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
    const equivocal = select.where(`is_true IS NULL`).orderBy("RANDOM()").limit(9); // limit 9 避免 certain 数量不足

    const sql = `(${certain.toSelect()} UNION ALL ${equivocal.toSelect()}) LIMIT 9`;
    const result = await dbPool
      .queryRows<Pick<DbCaptchaPicture, "id" | "is_true" | "type">>(sql)
      .then((item) => item.sort(() => Math.random() - 0.5));

    const answer: (boolean | null)[] = new Array(result.length);
    const allIdList: string[] = new Array(result.length);
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      allIdList[i] = item.id;
      answer[i] = item.is_true;
    }
    if (ENV.MODE === RunMode.E2E) {
      if (result.length < 9) {
        for (let i = result.length; i < 9; i++) {
          allIdList[i] = "null";
        }
        result.length = 9;
      }
      for (let i = 0; i < result.length; i++) {
        if (i < 3) answer[i] = true;
        else answer[i] = false;
      }
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
      title: "请选择包含校长的图片",
      sessionId,
      imageUrlList: data.allIdList.map((imageId, index) => "/captcha/image/" + sessionId + "-" + index),
      survivalTime: this.imageCaptcha.expire,
    };
  }
  private async imageVerifyOnly(sessionId: string, selectedIndex: number[]) {
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
  /** 确认验证码是否通过，如果通过，则更新未知图片的选择情况 */
  async verify(reply: ImageCaptchaReply): Promise<boolean> {
    const pass = await this.imageVerifyOnly(reply.sessionId, reply.selectedIndex);
    if (pass && ENV.MODE !== RunMode.E2E) {
      const assertCorrect = Array.from(pass.assertCorrect);
      const assertError = Array.from(pass.assertError);
      const add = captcha_picture
        .update({ yes_count: "yes_count + 1" })
        .where(`id in (${assertCorrect.map((value) => v(value)).join(",")})`);
      const sub = captcha_picture
        .update({ no_count: "no_count + 1" })
        .where(`id in (${assertError.map((value) => v(value)).join(",")})`);

      if (assertCorrect.length && assertError.length) {
        await using q = dbPool.begin();
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
    return ctx.req.param("filepath");
  })
  @PipeOutput(function ({ stream, mime }, ctx) {
    ctx.header("Content-Type", mime);
    return ctx.body(stream, 200);
  })
  @Get("/captcha/image/:filepath")
  async getCaptchaImageStream(imageUri: string) {
    const imageId = await this.imageUrlToId(imageUri).catch(() => null);
    if (!imageId) throw new HTTPException(404);
    const bucket = getOSS().getBucket(BUCKET.CAPTCHA_PICTURE);
    const mime = contentType(path.parse(imageId).ext);
    try {
      const stream = await bucket.getObjectStream(imageId);
      return { mime, stream };
    } catch (error) {
      throw new HTTPException(404, { cause: error });
    }
  }
}
export const imageCaptchaController = new ImageCaptchaController();

type ImageCaptchaSession = {
  answers: (boolean | null)[];
  allIdList: string[];
};
