import * as stat from "./stat/mod.ts";
import * as user from "./user/mod.ts";

export const controllers: object[] = [...user.controllers, ...stat.controllers];
