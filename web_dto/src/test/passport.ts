
export interface TestPassportAPI {
  /**
   * 创建题目
   */
  "POST /test/passport/login": {
    body: { email: string };
  };
}
