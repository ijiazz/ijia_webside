import type { TestExaminationAPI } from "./test/examination.ts";
import type { TestPassportAPI } from "./test/passport.ts";



export interface TestAPI extends TestExaminationAPI, TestPassportAPI { }

export * from "./test/examination.ts";
export * from "./test/passport.ts";