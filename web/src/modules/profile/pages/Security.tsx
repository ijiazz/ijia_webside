import { Form, Input, Button, Steps, Modal, Space } from "antd";
import { useAsync } from "@/hooks/async.ts";
import { useAntdStatic } from "@/hooks/antd.ts";
import { CAN_HASH_PASSWORD, hashPassword } from "@/modules/passport/util/pwd_hash.ts";
import { PagePadding } from "@/lib/components/Page.tsx";
import React, { useEffect, useMemo, useState } from "react";
import { EmailInput } from "@/modules/passport/components/EmailInput.tsx";
import { api, isHttpErrorCode } from "@/common/http.ts";
import { MailOutlined } from "@ant-design/icons";
import { useCurrentUser } from "@/common/user.ts";
import { HoFetchStatusError } from "@asla/hofetch";
export function Security() {
  return (
    <PagePadding>
      <ChangePassport />
      <ChangeEmail />
    </PagePadding>
  );
}
function ChangePassport() {
  const { message } = useAntdStatic();
  const { loading, run: onFinish } = useAsync(async function (body: { newPassword: string; oldPassword: string }) {
    let { newPassword, oldPassword } = body;
    if (CAN_HASH_PASSWORD) {
      newPassword = await hashPassword(newPassword);
      oldPassword = await hashPassword(oldPassword);
    }
    await api["/passport/change_password"].post({
      body: { newPassword, oldPassword, passwordNoHash: !CAN_HASH_PASSWORD },
    });
    message.success("已修改");
  });

  return (
    <div>
      <h3>修改密码</h3>
      <Form name="change_password" onFinish={onFinish} layout="vertical" style={{ maxWidth: 400 }}>
        <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true }]}>
          <Input.Password placeholder="请输入旧密码" />
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
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            确认修改
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

function ChangeEmail(props: {}) {
  const { value: user, refresh } = useCurrentUser();
  const [open, setOpen] = useState(false);

  if (!user) return;
  return (
    <div style={{ maxWidth: 400 }}>
      <h3>修改邮箱</h3>
      <Space>
        <MailOutlined />
        <Input className="e2e-current-user" value={user.email} disabled />
        <Button onClick={() => setOpen(true)}>修改</Button>
      </Space>
      <ChangeEmailModal open={open} oldEmail={user.email} onClose={() => setOpen(false)} onOk={refresh} />
    </div>
  );
}

function ChangeEmailModal(props: { oldEmail?: string; open?: boolean; onClose?: () => void; onOk?: () => void }) {
  const { onClose, onOk, open, oldEmail } = props;
  const { message } = useAntdStatic();
  const [token, setToken] = useState<string | null>();
  const step = useMemo(() => (token ? 1 : 0), [token]);
  const { run: sendNewEmailCaptcha, data: newEmailCaptcha } = useAsync(
    (email: string, sessionId: string, selected: number[]) =>
      api["/passport/change_email/email_captcha"].post({
        body: { email, captchaReply: { sessionId, selectedIndex: selected } },
      }),
  );
  const { run: changeEmail, loading } = useAsync(async (code: string, sessionId: string, newEmail: string) => {
    if (!token) {
      message.error("请先验证原邮箱");
      return;
    }
    if (!newEmailCaptcha) {
      message.error("请先获取验证码");
      return;
    }
    try {
      await api["/passport/change_email"].post({
        body: {
          emailCaptcha: { sessionId: sessionId, code: code },
          accountToken: token,
          newEmail,
        },
      });
      message.success("修改成功");
      onOk?.();
      onClose?.();
    } catch (error) {
      if (error instanceof HoFetchStatusError && error.status === 401) {
        console.dir(error);
        setToken(null);
      } else throw error;
    }
  });
  useEffect(() => {
    if (open) setToken(null);
  }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      title="修改邮箱"
      footer={null}
      destroyOnClose
      maskClosable={false}
    >
      <div style={{ maxWidth: 400 }}>
        <Steps
          current={step}
          items={[{ title: "验证原有邮箱" }, { title: "修改邮箱" }]}
          size="small"
          style={{ paddingBottom: "14px" }}
        />
        {step === 0 && <EmailAuthentication onOk={setToken} email={oldEmail} />}
        {step === 1 && (
          <Form onFinish={(formData) => changeEmail(formData.code, newEmailCaptcha!.sessionId, formData.newEmail)}>
            <Form.Item name="newEmail" label="新邮箱" rules={[{ required: true, type: "email" }]}>
              <EmailInput
                onCaptchaSubmit={async (email, sessionId, selected) => {
                  try {
                    await sendNewEmailCaptcha(email, sessionId, selected);
                    message.success("已发送");
                  } catch (error) {
                    if (isHttpErrorCode(error, "CAPTCHA_ERROR")) message.error("验证码错误");
                    throw error;
                  }
                }}
              />
            </Form.Item>
            <Form.Item name="code" label="验证码" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认
              </Button>
            </Form.Item>
          </Form>
        )}
      </div>
    </Modal>
  );
}

function EmailAuthentication(props: {
  emailLabel?: string;
  email?: string;
  userId?: number;
  onOk?: (token: string) => void;
}) {
  const { email, onOk } = props;

  const { message } = useAntdStatic();
  const { run: sendEmailCaptcha, data: emailCaptcha } = useAsync(async (sessionId: string, selected: number[]) => {
    return api["/passport/sign_account_token/email_captcha"].post({
      body: { captchaReply: { sessionId, selectedIndex: selected } },
    });
  });
  const { run: getAccountToken, loading: getTokenLoading } = useAsync(async (sessionId: string, code: string) => {
    const result = await api["/passport/sign_account_token"].post({
      body: { emailCaptcha: { sessionId: sessionId, code: code } },
    });
    // 暂时不保存，需要检测过期
    // ijiaSessionStorage.emailAuthToken = result.account_token;
    onOk?.(result.account_token);
  });

  return (
    <Form
      onFinish={(formData) => {
        if (!emailCaptcha) {
          message.error("请先获取验证码");
          return;
        }
        getAccountToken(emailCaptcha.sessionId, formData.code);
      }}
      initialValues={{ email }}
      labelCol={{ span: 4 }}
    >
      <Form.Item name="email" label="旧邮箱">
        <EmailInput
          disabledInput
          onCaptchaSubmit={async (email, sessionId, selected) => {
            try {
              await sendEmailCaptcha(sessionId, selected);
              message.success("已发送");
            } catch (error) {
              if (isHttpErrorCode(error, "CAPTCHA_ERROR")) message.error("验证码错误");
              throw error;
            }
          }}
        />
      </Form.Item>
      <Form.Item name="code" label="验证码" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={getTokenLoading}>
          下一步
        </Button>
      </Form.Item>
    </Form>
  );
}

export default Security;
