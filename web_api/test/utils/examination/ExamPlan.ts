import { Context, JWT_TOKEN_KEY } from "#test/fixtures/hono.ts";

export class ExamPlan {
  constructor(
    private api: Context["api"],
    private token: string,
    private examinationId: string | number,
  ) {
    this.api = api;
    this.token = token;
    this.examinationId = examinationId;
  }
  async start() {
    await this.api["/examination/:exam_id/start"].post({
      params: { exam_id: this.examinationId.toString() },
      [JWT_TOKEN_KEY]: this.token,
    });
  }
  async commitGetNext(answer: number[]) {
    const { question } = await this.api["/examination/:exam_id/next"].post({
      params: { exam_id: this.examinationId.toString() },
      [JWT_TOKEN_KEY]: this.token,
    });
    if (question === null) throw new Error("考试已结束，无法提交答案");
    await this.api["/examination/:exam_id/answer"].post({
      body: { index: question.index, answer },
      params: { exam_id: this.examinationId.toString() },
      [JWT_TOKEN_KEY]: this.token,
    });
  }
  async end() {
    await this.api["/examination/:exam_id/end"].post({
      params: { exam_id: this.examinationId.toString() },
      [JWT_TOKEN_KEY]: this.token,
    });
  }
  async getResult() {
    return await this.api["/examination/:exam_id/result"].get({
      params: { exam_id: this.examinationId.toString() },
      [JWT_TOKEN_KEY]: this.token,
    });
  }
  async getRecord() {
    return await this.api["/examination/:exam_id/record"].get({
      params: { exam_id: this.examinationId.toString() },
      [JWT_TOKEN_KEY]: this.token,
    });
  }
}
