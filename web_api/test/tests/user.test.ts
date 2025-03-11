import { expect, beforeEach, describe } from "vitest";
import { test, Context, Api } from "../fixtures/hono.ts";
import { dclass, pla_user, Platform, user_class_bind, user_platform_bind } from "@ijia/data/db";
import { BindPlatformParam, UpdateUserProfileParam, userController } from "@/modules/user/mod.ts";
import { applyController } from "@/hono-decorator/src/apply.ts";

import { loginService } from "@/modules/passport/services/passport.service.ts";
import { MockCheckServer } from "../__mocks__/CheckServer.ts";
import { setCheckerServer } from "@/services/douyin.ts";
import { v } from "@ijia/data/yoursql";

describe("bind", function () {
  const JWT_KEY = Symbol("jwtToken");
  let AliceId: number;
  let AliceToken: string;
  beforeEach<Context>(async ({ hono, hoFetch, ijiaDbPool }) => {
    AliceId = await loginService.createUser("abc@qq.com", {});
    AliceToken = await loginService.signJwt(AliceId, 60 * 100);
    hoFetch.use(async function (ctx, next) {
      const token = ctx[JWT_KEY];
      if (token) ctx.headers.set("cookie", "jwt-token=" + token);
      return next();
    });
    await pla_user
      .insert([
        { platform: Platform.douYin, pla_uid: "d0", signature: "abc\nIJIA学号：<" + AliceId + ">\n12c" },
        { platform: Platform.douYin, pla_uid: "d1", signature: "abcIJIA学号：<" + AliceId + ">12c" },
        { platform: Platform.douYin, pla_uid: "d2", signature: "IJIA学号：" },
      ])
      .query();

    applyController(hono, userController);
  });

  test("绑定检查", async function ({ api }) {
    function AliceBindCheck() {
      return api["/user/bind_platform/check"].fetchResult({
        params: { platformList: [{ platform: Platform.douYin, pla_uid: "d1" }].map((item) => JSON.stringify(item)) },
        [JWT_KEY]: AliceToken,
      });
    }

    const checkerServer = new MockCheckServer();
    setCheckerServer(checkerServer);
    const mockDouYinUser = { avatarPath: "abc.jpg", description: "IJIA学号：1", pla_uid: "d1", username: "ABC" };
    checkerServer.checkUserBind.mockImplementation(async function () {
      return { ...mockDouYinUser, pass: true };
    });
    checkerServer.getDouYinUserInfo.mockImplementationOnce(async function () {
      return mockDouYinUser;
    });

    await expect(AliceBindCheck()).resolves.toMatchObject({ platformUser: mockDouYinUser });
  });
  test("绑定", async function ({ api }) {
    function AliceBind(platform: BindPlatformParam["platformList"]) {
      return api["/user/bind_platform"].post({
        body: { platformList: platform },
        [JWT_KEY]: AliceToken,
      });
    }

    await AliceBind([{ platform: Platform.douYin, pla_uid: "d0" }]);
    await expect(getUserBindCount(AliceId), "成功绑定第1个账号").resolves.toBe(1);

    await AliceBind([{ platform: Platform.douYin, pla_uid: "d1" }]);
    await expect(getUserBindCount(AliceId), "成功绑定第2个账号").resolves.toBe(2);

    await expect(AliceBind([{ platform: Platform.douYin, pla_uid: "d2" }])).rejects.responseStatus(403);
    await expect(getUserBindCount(AliceId)).resolves.toBe(2);
  });
  test("绑定已存在的", async function ({ api }) {
    function userBind(userToken: string, platform: BindPlatformParam["platformList"]) {
      return api["/user/bind_platform"].post({
        body: { platformList: platform },
        [JWT_KEY]: userToken,
      });
    }
    function updateSignature(pla_uid: string, signature: string) {
      return pla_user
        .update({ signature: v(signature) })
        .where(`pla_uid=${v(pla_uid)}`)
        .queryCount();
    }
    await userBind(AliceToken, [{ platform: Platform.douYin, pla_uid: "d1" }]);

    const BobId = await loginService.createUser("bind_existed@qq.com", {});
    const BobToken = await loginService.signJwt(BobId, 60);

    await expect(updateSignature("d1", `IJIA学号：<${BobId}>`)).resolves.toBe(1);

    await userBind(BobToken, [{ platform: Platform.douYin, pla_uid: "d1" }]);

    await expect(getUserBindCount(BobId), "新绑定的用户成功绑定").resolves.toBe(1);
    await expect(getUserBindCount(AliceId), "原来绑定的用户被取消绑定").resolves.toBe(0);
  });
  function getUserBindCount(userId: number) {
    return user_platform_bind
      .select("*")
      .where(`user_id=${v(userId)}`)
      .queryCount();
  }
});
describe("update profile", function () {
  const JWT_KEY = Symbol("jwtToken");
  let AliceId: number;
  let AliceToken: string;
  beforeEach<Context>(async ({ hono, hoFetch, ijiaDbPool }) => {
    AliceId = await loginService.createUser("abc@qq.com", {});
    AliceToken = await loginService.signJwt(AliceId, 60 * 100);
    hoFetch.use(async function (ctx, next) {
      const token = ctx[JWT_KEY];
      if (token) ctx.headers.set("cookie", "jwt-token=" + token);
      return next();
    });
    applyController(hono, userController);
  });
  test("只能选择公共班级，且公共班级只能选一个", async function ({ api }) {
    const classes = await dclass
      .insert([
        { class_name: "1", is_public: true },
        { class_name: "2", is_public: true },
        { class_name: "3", is_public: false },
      ])
      .returning("*")
      .queryRows()
      .then((res) => res.map((item) => item.id));

    await expect(updateProfile(api, { publicClassId: classes[2] }), "只能选择公共班级").rejects.responseStatus(409);

    await updateProfile(api, { publicClassId: classes[0] });
    await expect(getUserPublicClassId(1), "成功绑定").resolves.toEqual([1]);

    await updateProfile(api, { publicClassId: classes[1] });
    await expect(getUserPublicClassId(1), "已更新").resolves.toEqual([2]);
  });
  function updateProfile(api: Api, body: UpdateUserProfileParam) {
    return api["/user/profile"].patch({ body: body, [JWT_KEY]: AliceToken });
  }
  function getUserPublicClassId(user_id: number): Promise<number[]> {
    return user_class_bind
      .fromAs("bind")
      .innerJoin(dclass, "class", [`bind.user_id=${v(user_id)}`, "class.is_public=TRUE", "class.id=bind.class_id"])
      .select("bind.*")
      .queryRows()
      .then((res) => res.map((item) => item.class_id));
  }
});
