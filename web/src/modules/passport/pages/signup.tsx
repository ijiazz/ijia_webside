import styled from "@emotion/styled";
import { Button, Form, Input, Space } from "antd";
import { useContext, useRef, useState } from "react";
import { tryHashPassword } from "../util/pwd_hash.ts";
import { ImageCaptchaPopover } from "@/common/capthca/ImageCaptcha.tsx";
import { useAsync } from "@/hooks/async.ts";
import { AndContext } from "@/hooks/antd.ts";
import { IjiaLogo } from "@/common/site-logo.tsx";
import { VideoBg } from "../components/VideoBg.tsx";
import { useRedirect } from "@/hooks/redirect.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { isHttpErrorCode } from "@/common/http.ts";
import { getPathByRouter } from "@/common/navigation.ts";
import { useCurrentUser } from "@/common/user.ts";
function useCooling(coolingTime = 60) {
  const [time, settime] = useState<number>(0);
  const ref = useRef<null | number>(null);

  const start = () => {
    if (ref.current) clearInterval(ref.current);
    settime(coolingTime);
    const id = setInterval(() => {
      settime((time) => {
        if (time - 1 === 0) clearInterval(id);
        return time - 1;
      });
    }, 1000);
    ref.current = id;
  };
  return {
    time,
    start,
  };
}

export function Signup() {
  return (
    <StyledPage>
      <VideoBg />
      <div className="main">
        <div className="header">
          <Space>
            <IjiaLogo />
            <h2>注册</h2>
          </Space>
        </div>
        <BasicInfo />
      </div>
    </StyledPage>
  );
}

function BasicInfo() {
  const [form] = Form.useForm<FormValues>();
  const { api } = useHoFetch();
  const { refresh } = useCurrentUser({ manual: true });
  const go = useRedirect({ defaultPath: () => getPathByRouter("/profile/center") });
  const { run: sendEmailCaptcha, result } = useAsync((email: string, sessionId: string, selected: number[]) =>
    api["/passport/signup/email_captcha"].post({
      body: { email, captchaReply: { sessionId, selectedIndex: selected } },
    }),
  );
  const { result: submitState, run: onSubmit } = useAsync(async function (value: FormValues) {
    const pwd = await tryHashPassword(value.password);
    const { userId, jwtKey } = await api["/passport/signup"].post({
      body: {
        email: value.email,
        password: pwd.password,
        passwordNoHash: pwd.passwordNoHash,
        emailCaptcha: { code: value.email_code, sessionId: result.value?.sessionId! },
      },
    });
    refresh(jwtKey);
    go();
  });
  const { message } = useContext(AndContext);
  return (
    <div style={{ padding: 32 }}>
      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} form={form} onFinish={onSubmit}>
        <Form.Item label="电子邮箱" name="email" rules={[{ required: true, type: "email" }]}>
          <EmailInput
            onCaptchaSubmit={async (email, sessionId, selected) => {
              try {
                await sendEmailCaptcha(email, sessionId, selected);
                message.success("已发送");
              } catch (error) {
                if (isHttpErrorCode(error, "CAPTCHA_ERROR")) message.error("验证码错误");
                throw error;
              }
            }}
          />
        </Form.Item>
        <Form.Item label="邮件验证码" name="email_code" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="密码" name="password" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="确认密码"
          name="password-confirm"
          dependencies={["password"]}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              async validator(_, value) {
                if (value && getFieldValue("password") !== value) throw new Error("密码不一致");
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form>
      <div style={{ display: "flex", justifyContent: "end" }}>
        <Button loading={submitState.loading} type="primary" htmlType="submit" onClick={() => form.submit()}>
          提交
        </Button>
      </div>
    </div>
  );
}
function EmailInput(props: {
  value?: string;
  onChange?(value: string): void;
  onCaptchaSubmit: (email: string, sessionId: string, selected: number[]) => Promise<void>;
}) {
  const cooling = useCooling();
  const form = Form.useFormInstance();
  const email: string | undefined = Form.useWatch("email", form);
  const emailIsValid = /[^@]+?@[^@]+/.test(email ?? "");
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Input {...props} onChange={(e) => props.onChange?.(e.currentTarget.value)} />
      <ImageCaptchaPopover
        disabled={!emailIsValid}
        onSubmit={(sessionId, select) => {
          return props.onCaptchaSubmit?.(email!, sessionId, select).then(cooling.start);
        }}
      >
        <Button disabled={!emailIsValid || cooling.time > 0}>
          发送验证码{cooling.time > 0 ? `${cooling.time}` : undefined}
        </Button>
      </ImageCaptchaPopover>
    </div>
  );
}
type FormValues = {
  email: string;
  email_code: string;
  password: string;
};
const StyledPage = styled.div`
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  .header {
    display: flex;
    justify-content: center;
  }
  .main {
    max-width: 600px;
    border-radius: 6px;
    box-shadow: 0 0 2px #d7d7d7;
    padding: 32px;

    background-color: #fff8;
    backdrop-filter: blur(6px);
  }
`;
