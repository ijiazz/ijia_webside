import { Form, Input, Button } from "antd";
import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { useAntdStatic } from "@/hooks/antd.ts";
import { ChangePasswordParam } from "@/api.ts";
import { CAN_HASH_PASSWORD, hashPassword } from "@/modules/passport/util/pwd_hash.ts";
import { Developing } from "@/common/page_state/Developing.tsx";
import { PagePadding } from "@/lib/components/Page.tsx";
import React from "react";
export function Security() {
  return (
    <PagePadding>
      <ChangePassport />
      <ChangeEmail />
    </PagePadding>
  );
}
export function ChangePassport() {
  const { api } = useHoFetch();
  const { message } = useAntdStatic();
  const {
    result: { loading },
    run: onFinish,
  } = useAsync(async function (body: ChangePasswordParam) {
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

function ChangeEmail() {
  const { api } = useHoFetch();
  const { message } = useAntdStatic();
  const { result, run: onEmailChange } = useAsync(async function (body: { newEmail: string; code: string }) {
    message.success("邮箱已修改");
  });

  return (
    <div style={{ maxWidth: 400 }}>
      <h3>修改邮箱</h3>
      <Developing />
      {/* <Form name="change_email" onFinish={onEmailChange} layout="vertical" style={{ maxWidth: 400 }}>
        <Form.Item name="newEmail" label="新邮箱" rules={[{ required: true, type: "email" }]}>
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={() => sendVerificationCode(Form.useForm().getFieldValue("newEmail"))}>
            发送验证码
          </Button>
        </Form.Item>
        <Form.Item name="code" label="验证码" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={emailLoading}>
            确认修改
          </Button>
        </Form.Item>
      </Form> */}
    </div>
  );
}

export default Security;
