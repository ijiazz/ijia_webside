import {
  checkType,
  ExpectType,
  InferExpect,
  optional,
  TypeCheckFn,
  CheckTypeError,
  createCheckerFn,
  integer,
} from "@asla/wokao";

const optionalString = nullishOptional("string");
const optionalBoolean = nullishOptional("boolean");

export function checkConfig(value: any): AppConfig {
  return checkType(value, appConfigChecker, { policy: "pass" });
}

function nullishOptional<T extends ExpectType, Def>(
  expect: T,
  defaultValue?: undefined,
): TypeCheckFn<InferExpect<T> | null>;
function nullishOptional<T extends ExpectType, Def>(expect: T, defaultValue: Def): TypeCheckFn<InferExpect<T> | Def>;
function nullishOptional<T extends ExpectType>(expect: T, defaultValue = null): TypeCheckFn<InferExpect<T>> {
  return optional(expect, "nullish", defaultValue) as any;
}

const emailConfigCheck: TypeCheckFn<EmailConfig | null> = function getEmailConfig(input: unknown): EmailConfig | null {
  if (!input) return null;
  const value = checkType(input, {
    senderName: "string",
    emailFrom: "string",
    password: optionalString,
    serverUrl: "string",
  });
  const serverUrl = value.serverUrl;
  let url: URL;
  try {
    url = new URL(serverUrl);
  } catch (error) {
    throw new CheckTypeError("不是有效的 URL");
  }
  if (url.protocol !== "smtps:") throw new CheckTypeError("只支持 smtps 协议");

  const senderEmail = value.emailFrom;

  return {
    senderName: value.senderName,
    emailFrom: senderEmail,
    auth: {
      user: senderEmail,
      password: value.password,
    },
    serverHost: url.hostname,
    serverPort: +url.port,
  };
};

export type EmailConfig = {
  senderName: string;
  emailFrom: string;

  auth?: { user: string; password?: string | null };

  serverHost: string;
  serverPort: number;
};
const appConfigChecker = {
  appName: nullishOptional("string", "IJIA 学院"),
  emailSender: optional(emailConfigCheck),
  passport: nullishOptional({
    emailVerifyDisabled: optionalBoolean,
    signupTip: optionalString,
    signupEnabled: optionalBoolean,
    loginCaptchaDisabled: optionalBoolean,
    loginTip: optionalString,
  }),
  post: nullishOptional({
    maximumDailyCount: nullishOptional(integer(0), 50), // 每日最大发布数量。如果为 0 则禁止发帖
  }),
  live_watch: nullishOptional(
    {
      pollingMinute: nullishOptional("number", 0),
    },
    { pollingMinute: 0 },
  ),
} satisfies ExpectType;

export type AppConfig = Readonly<InferExpect<typeof appConfigChecker>>;
