import { Button, Form, Input, Steps, Result } from "antd";
import React, { useContext } from "react";
import { useState } from "react";
import styled from "@emotion/styled";
import { EmailInput } from "../components/EmailInput.tsx";
import { useAsync } from "@/hooks/async.ts";
import { AndContext } from "@/hooks/antd.ts";
import { api, isHttpErrorCode } from "@/common/http.ts";
import { Link, useNavigate } from "react-router";
import { ROUTES } from "@/app.ts";
import { useTimeoutJump } from "@/hooks/timeout_jump.ts";
import { tryHashPassword } from "../util/pwd_hash.ts";
import { MaskBoard } from "../components/MaskBoard.tsx";
import { ArrowLeftOutlined } from "@ant-design/icons";
type FindAccountProps = {};

export function FindAccount(props: FindAccountProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const timer = useTimeoutJump({ timeoutSecond: 5, callback: () => navigate(ROUTES.Login) });
  return (
    <PageCSS>
      <MaskBoard>
        <Link to="/passport/login" viewTransition>
          <Button type="text" icon={<ArrowLeftOutlined />}>
            返回登录
          </Button>
        </Link>
        <div className="container">
          <Steps
            current={step}
            items={[
              {
                title: "重置密码",
              },
              { title: "完成" },
            ]}
          />
          <main>
            {step < 1 ? (
              <Email
                disabled={step !== 0}
                onOk={() => {
                  timer.start();
                  setStep(1);
                }}
              />
            ) : (
              <Result
                status="success"
                title="完成"
                subTitle="密码已重置"
                extra={
                  <Link className="e2e-go-to-login" to={ROUTES.Login}>
                    转跳到登录（{timer.resetTime}）
                  </Link>
                }
              ></Result>
            )}
          </main>
        </div>
      </MaskBoard>
    </PageCSS>
  );
}

const PageCSS = styled.div`
  background: url("/main/bg-login.webp");
  background-repeat: no-repeat;
  background-size: cover;
  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;
  .container {
    padding: 24px;
    main {
      margin: auto;
      margin-top: 48px;
    }
  }
`;

function Email(props: { disabled?: boolean; onOk?: () => void }) {
  const { disabled, onOk } = props;
  const { run: sendEmailCaptcha, result: emailCaptcha } = useAsync(
    (email: string, sessionId: string, selected: number[]) =>
      api["/passport/reset_password/email_captcha"].post({
        body: { email, captchaReply: { sessionId, selectedIndex: selected } },
      }),
  );

  const { run: submit, result } = useAsync(async (formData: ChangePasswordForm) => {
    const res = await tryHashPassword(formData.newPassword);
    const captcha = emailCaptcha.value;
    if (!captcha) throw new Error("缺少验证码");
    await api["/passport/reset_password"].post({
      body: {
        email: formData.email,
        emailCaptcha: { sessionId: captcha.sessionId, code: formData.email_code },
        newPassword: res.password,
        passwordNoHash: res.passwordNoHash,
      },
    });
    message.success("密码已修改");
    onOk?.();
    onOk?.();
  });
  const { message } = useContext(AndContext);
  return (
    <Form disabled={disabled} wrapperCol={{ span: 18 }} labelCol={{ span: 6 }} onFinish={submit}>
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
      <Form.Item name="newPassword" label="新密码" rules={[{ required: true }]}>
        <Input.Password placeholder="请输入新密码" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="确认密码"
        dependencies={["newPassword"]}
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            async validator(_, value) {
              if (value && getFieldValue("newPassword") !== value) throw new Error("两次密码必须相同");
            },
          }),
        ]}
      >
        <Input.Password placeholder="确认密码" />
      </Form.Item>
      <Form.Item style={{ display: "flex", justifyContent: "end" }}>
        <Button type="primary" htmlType="submit" disabled={disabled} loading={result.loading}>
          确认
        </Button>
      </Form.Item>
    </Form>
  );
}

type ChangePasswordForm = {
  email: string;
  email_code: string;
  newPassword: string;
  confirmPassword: string;
};
