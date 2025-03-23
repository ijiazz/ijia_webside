import {
  checkType,
  CustomChecker,
  ExpectType,
  InferExpect,
  optional,
  TypeCheckFn,
  TypeCheckFnCheckResult,
  verifyType,
} from "evlib/validator";

const optionalString = nullishOptional("string");
const optionalBoolean = nullishOptional("boolean");

export function checkConfig(value: any): AppConfig {
  return verifyType(value, appConfigChecker, { policy: "pass" });
}

function nullishOptional<T extends ExpectType, Def>(
  expect: T,
  defaultValue?: undefined,
): CustomChecker<InferExpect<T> | null>;
function nullishOptional<T extends ExpectType, Def>(expect: T, defaultValue: Def): CustomChecker<InferExpect<T> | Def>;
function nullishOptional<T extends ExpectType>(expect: T, defaultValue = null): CustomChecker<InferExpect<T>> {
  return optional(expect, "nullish", defaultValue) as any;
}

const emailConfigCheck: TypeCheckFn<EmailConfig | null> = function getEmailConfig(
  input: unknown,
): TypeCheckFnCheckResult<EmailConfig | null> {
  if (!input) return { replace: true, value: null };
  const { value, error } = checkType(input, {
    senderName: "string",
    emailFrom: "string",
    password: optionalString,
    serverUrl: "string",
  });
  if (error) return { error };
  const serverUrl = value.serverUrl;
  let url: URL;
  try {
    url = new URL(serverUrl);
  } catch (error) {
    return { error: "不是有效的 URL" };
  }
  if (url.protocol !== "smtps:") return { error: "只支持 smtps 协议" };

  const senderEmail = value.emailFrom;

  return {
    value: {
      senderName: value.senderName,
      emailFrom: senderEmail,
      auth: {
        user: senderEmail,
        password: value.password,
      },
      serverHost: url.hostname,
      serverPort: +url.port,
    },
    replace: true,
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
  emailSender: emailConfigCheck,
  passport: nullishOptional({
    emailVerifyDisabled: optionalBoolean,
    signupTip: optionalString,
    signupEnabled: optionalBoolean,
    loginCaptchaDisabled: optionalBoolean,
    loginTip: optionalString,
  }),
  live_watch: nullishOptional(
    {
      pollingMinute: nullishOptional("number", 0),
    },
    { pollingMinute: 0 },
  ),
} satisfies ExpectType;

export type AppConfig = Readonly<InferExpect<typeof appConfigChecker>>;
