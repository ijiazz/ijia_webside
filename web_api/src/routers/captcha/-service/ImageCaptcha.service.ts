import { ImageCaptchaQuestion, ImageCaptchaReply } from "@/dto/captcha.ts";
import { captcha_picture } from "@ijia/data/db";
import { dbPool } from "@ijia/data/dbclient";
import { HTTPException } from "hono/http-exception";
import { SessionManager } from "../-utils/_SessionManage.ts";
import { getOSS, getBucket } from "@ijia/data/oss";
import { contentType } from "@std/media-types";
import path from "node:path";
import { ENV, RunMode } from "@/config.ts";
import { update } from "@asla/yoursql";
import { v } from "@/sql/utils.ts";
import { getRandomImageCaptcha } from "../-sql/getRandomImageCaptcha.sql.ts";
const BUCKET = getBucket();

export class ImageCaptchaService {
  constructor() {
    if (ENV.MODE === RunMode.E2E) {
      console.log("E2E测试模式，验证码总是选择前 3 个图片");
    }
  }
  readonly imageCaptcha = new SessionManager<ImageCaptchaSession>("Captcha:image", 3 * 60);

  private async imageCreateSessionData(): Promise<ImageCaptchaSession> {
    const result = await getRandomImageCaptcha();

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

  async createSession(sessionId?: string): Promise<ImageCaptchaQuestion> {
    const data = await this.imageCreateSessionData();
    sessionId = await this.imageCaptcha.set(data, { sessionId });
    return {
      title: "请选择包含佳佳的图片",
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
      const add = update(captcha_picture.name)
        .set({ yes_count: "yes_count + 1" })
        .where(`id in (${assertCorrect.map((value) => v(value)).join(",")})`);
      const sub = update(captcha_picture.name)
        .set({ no_count: "no_count + 1" })
        .where(`id in (${assertError.map((value) => v(value)).join(",")})`);

      if (assertCorrect.length && assertError.length) {
        await using q = dbPool.begin();
        await q.query(add);
        await q.query(sub);
        await q.commit();
      } else if (assertCorrect.length) {
        await dbPool.query(add);
      } else if (assertError.length) {
        await dbPool.query(sub);
      }
    }
    return !!pass;
  }

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
type ImageCaptchaSession = {
  answers: (boolean | null)[];
  allIdList: string[];
};

export const imageCaptchaService = new ImageCaptchaService();
