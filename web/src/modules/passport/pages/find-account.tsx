import { Button, Form, Input, Steps, Result } from "antd";
import React, { useContext } from "react";
import { useState } from "react";
import styled from "@emotion/styled";
import { EmailInput } from "../components/EmailInput.tsx";
import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { AndContext } from "@/hooks/antd.ts";
import { isHttpErrorCode } from "@/common/http.ts";
import { Link, useNavigate } from "react-router";
import { ROUTES } from "@/app.ts";
import { useTimeoutJump } from "@/hooks/timeout_jump.ts";
import { tryHashPassword } from "../util/pwd_hash.ts";
import { ijiaCookie } from "@/stores/cookie.ts";
type FindAccountProps = {};

export function FindAccount(props: FindAccountProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const timer = useTimeoutJump({ timeoutSecond: 5, callback: () => navigate(ROUTES.Login) });
  return (
    <PageCSS>
      <Steps
        current={step}
        items={[
          {
            title: "验证邮箱",
          },
          {
            title: "重置密码",
          },
          { title: "完成" },
        ]}
      />
      <main>
        {step < 2 ? (
          <>
            <Email disabled={step !== 0} onOk={() => setStep(1)} />
            <ChangePassword
              disabled={step !== 1}
              onOk={() => {
                setStep(2);
                timer.start();
              }}
            />
          </>
        ) : (
          <Result
            status="success"
            title="完成"
            subTitle="密码已重置"
            extra={<Link to={ROUTES.Login}>转跳到登录（{timer.resetTime}）</Link>}
          ></Result>
        )}
      </main>
    </PageCSS>
  );
}

const PageCSS = styled.div`
  max-width: 400px;
  margin: auto;
  padding: 24px;
  main {
    margin: auto;
    margin-top: 48px;
  }
`;

function Email(props: { disabled?: boolean; onOk?: () => void }) {
  const { disabled, onOk } = props;
  const { api } = useHoFetch();
  const { run: sendEmailCaptcha } = useAsync((email: string, sessionId: string, selected: number[]) =>
    api["/passport/find-account/email_captcha"].post({
      body: { email, captchaReply: { sessionId, selectedIndex: selected } },
    }),
  );
  const { run: submit, result } = useAsync(({ email_code }: { email_code: string }) => {
    // TODO
    console.log(email_code);
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
      <Form.Item style={{ display: "flex", justifyContent: "end" }}>
        <Button type="primary" htmlType="submit" disabled={disabled} loading={result.loading}>
          确认
        </Button>
      </Form.Item>
    </Form>
  );
}
function ChangePassword(props: { disabled?: boolean; onOk?: () => void }) {
  const { disabled, onOk } = props;
  const { message } = useContext(AndContext);
  const { api } = useHoFetch();
  const { run, result } = useAsync(async (data: ChangePasswordForm) => {
    const res = await tryHashPassword(data.newPassword);
    await api["/passport/change_password"].post({
      body: { newPassword: res.password, passwordNoHash: res.passwordNoHash },
    });
    ijiaCookie.securityToken = undefined;
    message.success("密码已修改");
    onOk?.();
  });
  return (
    <Form disabled={disabled} wrapperCol={{ span: 18 }} labelCol={{ span: 6 }} onFinish={run}>
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
        <Button type="primary" htmlType="submit" loading={result.loading}>
          确认
        </Button>
      </Form.Item>
    </Form>
  );
}
type ChangePasswordForm = {
  newPassword: string;
  confirmPassword: string;
};
