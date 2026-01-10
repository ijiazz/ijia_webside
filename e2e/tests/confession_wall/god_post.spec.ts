import { getAppUrlFromRoute, vioServerTest as test } from "@/fixtures/test.ts";
import { initAlice, loginGetToken } from "@/__mocks__/user.ts";
import { DbPlaUserCreate, Platform, USER_LEVEL } from "@ijia/data/db";
import { insertPosts } from "@api-test/__mocks__/posts.ts";
import { deleteFrom } from "@asla/yoursql";
import { dbPool } from "@/db/client.ts";
import { insertIntoValues } from "@/sql/utils.ts";
const { expect, beforeEach, beforeAll, describe } = test;

const POST_ROUTE = "/live";
describe.skip("登录的账号", function () {
  let aliceToken: string;
  beforeEach(async ({ page }) => {
    const Alice = await initAlice();
    aliceToken = await loginGetToken(Alice.email, Alice.password);
  });
});

test.skip("游客查看帖子列表", async function ({ page, browser }) {
  await insertMock();
  await dbPool.query(deleteFrom("pla_asset"));
  await insertPosts(12, Platform.douYin, "dy0");
  await insertPosts(12, Platform.douYin, "dy1");
  await page.goto(getAppUrlFromRoute(POST_ROUTE));

  await expect(page.getByText("post-douyin-dy0-11")).toHaveCount(1);

  await page.getByText("2", { exact: true }).click();
  await page.getByRole("link", { name: "登录后查看更多" }).click();
  await expect(page).toHaveURL(getAppUrlFromRoute("/passport/login"));
});

/**
 * dy0: god
 * dy1: second
 * wb0: god
 * wb1: null
 */
async function insertMock() {
  const users: DbPlaUserCreate[] = [
    { platform: Platform.douYin, pla_uid: "dy0" },
    { platform: Platform.douYin, pla_uid: "dy1" },
  ];
  await dbPool.execute(deleteFrom("pla_user"));
  await dbPool.execute(insertIntoValues("pla_user", users).onConflict(["platform", "pla_uid"]).doNotThing());
  await dbPool.execute(
    insertIntoValues("watching_pla_user", [
      { level: USER_LEVEL.god, platform: users[0].platform, pla_uid: users[0].pla_uid },
      { level: USER_LEVEL.god, platform: users[1].platform, pla_uid: users[1].pla_uid },
    ])
      .onConflict(["platform", "pla_uid"])
      .doNotThing(),
  );
  return users;
}
