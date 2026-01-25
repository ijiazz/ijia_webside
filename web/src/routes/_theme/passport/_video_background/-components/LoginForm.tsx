import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Alert, Button, Tabs } from "antd";
import { useState } from "react";
import { LoginMethod, PassportConfig, UserLoginParam } from "@/api.ts";
import { CAN_HASH_PASSWORD } from "@/common/pwd_hash.ts";
import { useThemeToken } from "@/provider/mod.tsx";
import { IjiaLogo } from "@/common/site-logo.tsx";
import { ImageCaptchaModal } from "@/common/capthca/ImageCaptcha.tsx";
import { getPathByRoute } from "@/app.ts";
import { Route as ParentRoute } from "../route.tsx";
import { LoginFormCSS } from "./LoginForm.css.tsx";
import {
  EmailLoginFormValues,
  getPasswordLoginParam,
  LoginFormValues,
  PasswordLoginFormValues,
  useLogin,
} from "../-utils/loginFormValues.ts";
import { useForm, FormProvider } from "react-hook-form";
import { EmailLoginForm } from "./EmailLoginForm.tsx";
import { PasswordLoginForm } from "./PasswordLoginForm.tsx";
import { LoginFooter } from "./LoginFooter.tsx";

type Msg = {
  type?: "info" | "success" | "error" | "warning";
  title: string;
};
const defaultMessage: Msg | undefined = CAN_HASH_PASSWORD
  ? undefined
  : {
      type: "warning",
      title: "当前环境无法对密码进行加密，你的密码将以明文发送到服务器！",
    };

export function LoginForm() {
  const form = useForm<LoginFormValues>({
    defaultValues: {
      keepLoggedIn: true,
    },
  });
  const config: PassportConfig = ParentRoute.useLoaderData() ?? {};
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(LoginMethod.password);
  const [messageText, setMessageText] = useState<Msg | undefined>(defaultMessage);
  const { search } = useLocation();
  const navigate = useNavigate();

  const [captchaModalOpen, setCaptchaModalOpen] = useState(false);
  const { handleLogin: submitLogin, loginLoading } = useLogin({
    onField(result) {
      setMessageText({ title: result.message ?? "登录失败", type: "error" });
    },
    onSuccess: () => {
      const redirectPath = search["redirect"] || getPathByRoute("/live");
      if (redirectPath.startsWith("http:") || redirectPath.startsWith("https:")) {
        window.location.href = redirectPath;
      } else {
        navigate({ to: redirectPath });
      }
    },
  });

  const handleLogin = async (input: LoginFormValues) => {
    setMessageText(defaultMessage);
    let params: UserLoginParam;
    switch (loginMethod) {
      case LoginMethod.password:
        params = await getPasswordLoginParam(input as PasswordLoginFormValues);
        break;
      case LoginMethod.emailCaptcha:
        const target = input as EmailLoginFormValues;
        params = {
          method: LoginMethod.emailCaptcha,
          email: target.email.email,
          keepLoggedIn: target.keepLoggedIn,
          emailCaptcha: { code: target.emailCaptcha, sessionId: target.email.sessionId },
        };
        break;

      default:
        const message = "不支持的登录方式：" + loginMethod;
        setMessageText({ title: message, type: "error" });
        throw new Error(message);
    }
    return submitLogin(params);
  };

  const theme = useThemeToken();
  return (
    <LoginFormCSS>
      <div className="logo">
        <Link to="/" title="首页" viewTransition>
          <IjiaLogo size={44} />
        </Link>
        IJIA 学院
      </div>
      <span style={{ color: theme.colorTextDescription, fontSize: theme.fontSize }}>要一直在哦！</span>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit((param) => {
            if (config.loginCaptchaDisabled || loginMethod === LoginMethod.emailCaptcha) {
              handleLogin(param);
            } else {
              setCaptchaModalOpen(true);
            }
          })}
        >
          <Tabs
            destroyOnHidden
            items={[
              {
                key: LoginMethod.password,
                label: "账号密码登录",
                children: <PasswordLoginForm />,
              },
              {
                key: LoginMethod.emailCaptcha,
                label: "邮箱验证码登录",
                children: <EmailLoginForm />,
              },
            ]}
            centered
            activeKey={loginMethod}
            onChange={(activeKey) => {
              setLoginMethod(activeKey as LoginMethod);
              form.reset();
            }}
          />
          <LoginFooter />
          <div className="message">{messageText && <Alert type={messageText.type} title={messageText.title} />}</div>
          <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
            <Link to="../find-account" style={{ float: "right" }} viewTransition>
              忘记密码
            </Link>
            <Link to="../signup" style={{ float: "right" }} viewTransition>
              注册账号
            </Link>
          </div>
          <Button htmlType="submit" type="primary" size="large" loading={loginLoading}>
            登录
          </Button>
        </form>
        <ImageCaptchaModal
          open={captchaModalOpen}
          onSubmit={(sessionId: string, selectedIndex: number[]) => {
            setCaptchaModalOpen(false);
            const values = form.getValues();
            handleLogin({ ...values, captcha: { sessionId, selectedIndex } });
          }}
          onCancel={() => setCaptchaModalOpen(false)}
        />
      </FormProvider>
    </LoginFormCSS>
  );
}
