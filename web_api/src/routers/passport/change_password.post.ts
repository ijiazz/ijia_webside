import { checkValueAsync } from "@/global/check.ts";
import { optional } from "@asla/wokao";
import { hashPasswordFrontEnd } from "./-services/password.ts";
import { changeAccountPassword } from "./-sql/account.ts";
import routeGroup from "./_route.ts";

export default routeGroup.create({
  method: "POST",
  routePath: "/passport/change_password",
  async validateInput(ctx) {
    const userInfo = ctx.get("userInfo");
    const userId = await userInfo.getUserId();

    const param = await checkValueAsync(ctx.req.json(), {
      newPassword: "string",
      oldPassword: "string",
      passwordNoHash: optional.boolean,
    });

    if (param.passwordNoHash) {
      const res = await Promise.all([
        hashPasswordFrontEnd(param.newPassword),
        hashPasswordFrontEnd(param.oldPassword!),
      ]);
      param.newPassword = res[0];
      param.newPassword = res[1];
    }
    return { userId, newPassword: param.newPassword, oldPassword: param.oldPassword };
  },
  async handler({ userId, newPassword, oldPassword }) {
    await changeAccountPassword(userId, oldPassword, newPassword);
  },
});
