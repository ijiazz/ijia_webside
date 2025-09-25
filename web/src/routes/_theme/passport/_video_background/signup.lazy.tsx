import { createLazyFileRoute, Link } from "@tanstack/react-router";
import styled from "@emotion/styled";
import { Button, Checkbox, Form, Input, Space } from "antd";
import React from "react";
import { tryHashPassword } from "../../../../common/pwd_hash.ts";
import { useAsync } from "@/hooks/async.ts";
import { useAntdStatic, useThemeToken } from "@/provider/mod.tsx";
import { IjiaLogo } from "@/common/site-logo.tsx";
import { useRedirect } from "@/hooks/redirect.ts";
import { api, isHttpErrorCode } from "@/common/http.ts";
import { getPathByRoute } from "@/app.ts";
import { useCurrentUser } from "@/common/user.ts";
import { EmailInput } from "../../../../common/EmailInput.tsx";
import { PassportConfig } from "@/api.ts";
import { MaskBoard } from "../-components/MaskBoard.tsx";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Route as ParentRoute } from "./route.tsx";

export const Route = createLazyFileRoute("/_theme/passport/_video_background/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  const config: PassportConfig = ParentRoute.useLoaderData() ?? {};
  const theme = useThemeToken();
  return (
    <StyledPage>
      <MaskBoard>
        <Link to="/passport/login" viewTransition>
          <Button type="text" icon={<ArrowLeftOutlined />}>
            返回登录
          </Button>
        </Link>
        <div className="header">
          <Space>
            <IjiaLogo />
            <h2>注册</h2>
          </Space>
          <div style={{ color: theme.colorTextDescription, fontSize: theme.fontSize }}>{config.signupTip}</div>
        </div>
        <BasicInfo passportConfig={config} />
      </MaskBoard>
    </StyledPage>
  );
}

function BasicInfo(props: { passportConfig: PassportConfig }) {
  const { passportConfig: config } = props;
  const [form] = Form.useForm<FormValues>();
  const { refresh } = useCurrentUser({ manual: true });
  const go = useRedirect({ defaultPath: () => getPathByRoute("/profile/center") });
  const { run: sendEmailCaptcha, data: emailCaptcha } = useAsync(
    (email: string, sessionId: string, selected: number[]) =>
      api["/passport/signup/email_captcha"].post({
        body: { email, captchaReply: { sessionId, selectedIndex: selected } },
      }),
  );
  const { loading: signupLoading, run: onSubmit } = useAsync(async function (value: FormValues) {
    const pwd = await tryHashPassword(value.password);
    const { userId, jwtKey } = await api["/passport/signup"].post({
      body: {
        email: value.email,
        password: pwd.password,
        passwordNoHash: pwd.passwordNoHash,
        emailCaptcha: { code: value.email_code, sessionId: emailCaptcha?.sessionId! },
      },
    });
    refresh(jwtKey);
    go();
  });
  const { message } = useAntdStatic();
  return (
    <div style={{ padding: 28 }} className="basic-info">
      <Form
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        form={form}
        onFinish={onSubmit}
        disabled={!config.signupEnabled}
      >
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
        <Form.Item
          label=" "
          colon={false}
          name="agreement"
          rules={[
            {
              async validator(rule, value, callback) {
                if (!value) throw new Error("请先关注佳佳子_zZ");
              },
            },
          ]}
          valuePropName="checked"
        >
          <Checkbox value="agree" style={{ marginBottom: 8 }}>
            我已在抖音关注&nbsp;
            <b>
              <a
                target="_blank"
                href="https://www.douyin.com/user/MS4wLjABAAAA0AiK9Q4FlkTxKHo-b6Vi1ckA2Ybq-WNgJ-b5xXlULtI"
                style={{ color: "#003674" }}
              >
                佳佳子_zZ
              </a>
            </b>
          </Checkbox>
        </Form.Item>
      </Form>
      <div style={{ display: "flex", justifyContent: "end" }}>
        <Button
          disabled={!config.signupEnabled}
          loading={signupLoading}
          type="primary"
          htmlType="submit"
          onClick={() => form.submit()}
        >
          提交
        </Button>
      </div>
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
  display: flex;
  align-items: center;
  justify-content: center;
  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
`;
