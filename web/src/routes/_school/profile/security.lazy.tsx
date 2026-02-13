import { createLazyFileRoute } from "@tanstack/react-router";

import { Form, Input, Button, Steps, Modal, Space } from "antd";
import { useAntdStatic } from "@/provider/mod.tsx";
import * as styles from "@/lib/components/Page.tsx";
import { useEffect, useMemo, useState } from "react";
import { api, isHttpErrorCode } from "@/request/client.ts";
import { MailOutlined } from "@ant-design/icons";
import { HoFetchStatusError } from "@asla/hofetch";
import { CAN_HASH_PASSWORD, hashPassword } from "@/common/pwd_hash.ts";
import { EmailInput } from "@/components/EmailInput.tsx";
import { EmailCaptchaActionType } from "@/api.ts";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { EmailAuthentication } from "./-components/security/EmailAuthentication.tsx";
import { CurrentUserInfoQueryOption } from "@/request/user.ts";
import { queryClient } from "@/request/client.ts";

export const Route = createLazyFileRoute("/_school/profile/security")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className={styles.PagePadding}>
      <ChangePassport />
      <ChangeEmail />
    </div>
  );
}
function ChangePassport() {
  const { message } = useAntdStatic();

  const { isPending: loading, mutate: onFinish } = useMutation({
    mutationFn: async function (body: { newPassword: string; oldPassword: string }) {
      let { newPassword, oldPassword } = body;
      if (CAN_HASH_PASSWORD) {
        newPassword = await hashPassword(newPassword);
        oldPassword = await hashPassword(oldPassword);
      }
      await api["/passport/change_password"].post({
        body: { newPassword, oldPassword, passwordNoHash: !CAN_HASH_PASSWORD },
      });
    },
    onSuccess: () => {
      message.success("已修改");
    },
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
  const { data: user } = useSuspenseQuery(CurrentUserInfoQueryOption);
  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: CurrentUserInfoQueryOption.queryKey });
  };
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
      <ChangeEmailModal open={open} oldEmail={user.email} onClose={() => setOpen(false)} onOk={invalidateUser} />
    </div>
  );
}

function ChangeEmailModal(props: { oldEmail?: string; open?: boolean; onClose?: () => void; onOk?: () => void }) {
  const { onClose, onOk, open, oldEmail } = props;
  const { message } = useAntdStatic();
  const [token, setToken] = useState<string | null>();
  const step = useMemo(() => (token ? 1 : 0), [token]);
  const { data: newEmailCaptcha, mutateAsync: sendNewEmailCaptcha } = useMutation({
    mutationFn: (param: { email: string; sessionId: string; selected: number[] }) =>
      api["/captcha/email/send"].post({
        body: {
          email: param.email,
          captchaReply: { sessionId: param.sessionId, selectedIndex: param.selected },
          actionType: EmailCaptchaActionType.changeEmail,
        },
      }),
  });
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (param: { code: string; sessionId: string; newEmail: string; token: string }) => {
      return api["/passport/change_email"].post({
        body: {
          emailCaptcha: { sessionId: param.sessionId, code: param.code },
          accountToken: param.token,
          newEmail: param.newEmail,
        },
      });
    },
    onSuccess(data) {
      message.success("修改成功");
      onOk?.();
      onClose?.();
    },
    onError(error) {
      if (error instanceof HoFetchStatusError && error.status === 401) {
        console.dir(error);
        setToken(null);
      }
    },
  });
  const changeEmail = (code: string, newEmail: string) => {
    if (!token) {
      message.error("请先验证原邮箱");
      return;
    }
    if (!newEmailCaptcha) {
      message.error("请先获取验证码");
      return;
    }
    mutateAsync({ code, sessionId: newEmailCaptcha.sessionId, newEmail: newEmail, token });
  };
  useEffect(() => {
    if (open) setToken(null);
  }, [open]);
  return (
    <Modal open={open} onCancel={onClose} title="修改邮箱" footer={null} destroyOnHidden maskClosable={false}>
      <div style={{ maxWidth: 400 }}>
        <Steps
          current={step}
          items={[{ title: "验证原有邮箱" }, { title: "修改邮箱" }]}
          size="small"
          style={{ paddingBottom: "14px" }}
        />
        {step === 0 && <EmailAuthentication onOk={setToken} email={oldEmail} />}
        {step === 1 && (
          <Form onFinish={(formData) => changeEmail(formData.code, formData.newEmail)}>
            <Form.Item name="newEmail" label="新邮箱" rules={[{ required: true, type: "email" }]}>
              <EmailInput
                onCaptchaSubmit={async (email, sessionId, selected) => {
                  try {
                    await sendNewEmailCaptcha({ email, sessionId, selected });
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
              <Button type="primary" htmlType="submit" loading={isPending}>
                确认
              </Button>
            </Form.Item>
          </Form>
        )}
      </div>
    </Modal>
  );
}
