import * as test from "./test_api/test.module.ts";
import * as stat from "./stat/mod.ts";
import * as user from "./user/mod.ts";
import { ControllerDecoratorTarget } from "@asla/hono-decorator";

export const controllers: ControllerDecoratorTarget[] = [...test.controllers, ...user.controllers, ...stat.controllers];
