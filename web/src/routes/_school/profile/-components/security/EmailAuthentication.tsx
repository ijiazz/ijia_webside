import { Form, Input, Button } from "antd";
import { useAntdStatic } from "@/provider/mod.tsx";
import { api, isHttpErrorCode } from "@/request/client.ts";
import { EmailInput } from "@/components/EmailInput.tsx";
import { EmailCaptchaActionType, EmailCaptchaReply, ImageCaptchaReply } from "@/api.ts";
import { useMutation } from "@tanstack/react-query";

export function EmailAuthentication(props: {
  emailLabel?: string;
  email?: string;
  userId?: number;
  onOk?: (token: string) => void;
}) {
  const { email, onOk } = props;

  const { message } = useAntdStatic();
  const { mutateAsync: sendEmailCaptcha, data: emailCaptcha } = useMutation({
    mutationFn: async (param: ImageCaptchaReply) => {
      return api["/captcha/email/send_self"].post({
        body: { captchaReply: param, actionType: EmailCaptchaActionType.signAccountToken },
      });
    },
  });
  const { mutateAsync: getAccountToken, isPending: getTokenLoading } = useMutation({
    mutationFn: async (param: EmailCaptchaReply) => {
      return api["/passport/sign_account_token"].post({
        body: { emailCaptcha: param },
      });
    },
    onSuccess: (data) => {
      // 暂时不保存，需要检测过期
      // ijiaSessionStorage.emailAuthToken = data.account_token;
      onOk?.(data.account_token);
    },
  });

  return (
    <Form
      onFinish={(formData) => {
        if (!emailCaptcha) {
          message.error("请先获取验证码");
          return;
        }
        getAccountToken({ sessionId: emailCaptcha.sessionId, code: formData.code });
      }}
      initialValues={{ email }}
      labelCol={{ span: 4 }}
    >
      <Form.Item name="email" label="旧邮箱">
        <EmailInput
          disabledInput
          onCaptchaSubmit={async (email, sessionId, selected) => {
            try {
              await sendEmailCaptcha({ sessionId, selectedIndex: selected });
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
