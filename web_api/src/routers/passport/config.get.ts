import { PassportConfig } from "@/dto/passport.ts";
import routeGroup from "./_route.ts";
import { appConfig } from "@/config.ts";

export default routeGroup.create({
  method: "GET",
  routePath: "/passport/config",
  async handler(): Promise<PassportConfig> {
    const p = appConfig.passport;
    if (!p) return {};
    return {
      signupEnabled: p.signupEnabled,
      loginCaptchaDisabled: p.loginCaptchaDisabled,
      signupTip: p.signupTip,
      loginTip: p.loginTip,
    };
  },
});
