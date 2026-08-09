
export interface TestPassportAPI {
  /**
   * 登录
   */
  "POST /test/passport/login": {
    body: { email: string } | { id: string };
    response: { token: string };
  };
}
