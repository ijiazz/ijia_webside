import { EmailCaptchaActionType } from "@/api.ts";
import { EmailInput } from "@/common/EmailInput.tsx";
import { FormErrorMessage, getAntdErrorStatus } from "@/components/FormItem.tsx";
import { useAntdStatic } from "@/provider/mod.tsx";
import { api, isHttpErrorCode } from "@/request/client.ts";
import { UserOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { Controller } from "react-hook-form";

export function EmailLoginForm() {
  const { message } = useAntdStatic();

  return (
    <>
      <Controller
        name="email"
        rules={{
          required: "请输入邮箱",
          validate: (value) => {
            if (typeof value !== "object") return "请输入邮箱";
            if (!value.email) return "请输入邮箱";
            if (!value.sessionId) return "请先获取邮箱验证码";
            return undefined;
          },
        }}
        render={({ field, fieldState }) => {
          const fieldValue = field.value;
          return (
            <>
              <EmailInput
                {...field}
                value={fieldValue?.email}
                status={getAntdErrorStatus(fieldState)}
                onChange={(value) => {
                  field.onChange({ ...fieldValue, email: value });
                }}
                prefix={<UserOutlined />}
                placeholder="填写邮箱"
                onCaptchaSubmit={async (email, sessionId, selected) => {
                  try {
                    const { sessionId: newSessionId } = await api["/captcha/email/send"].post({
                      body: {
                        email: email,
                        captchaReply: { sessionId: sessionId, selectedIndex: selected },
                        actionType: EmailCaptchaActionType.login,
                      },
                    });
                    field.onChange({ ...fieldValue, sessionId: newSessionId });
                    message.success("已发送");
                  } catch (error) {
                    if (isHttpErrorCode(error, "CAPTCHA_ERROR")) message.error("验证码错误");
                    throw error;
                  }
                }}
              />
              <FormErrorMessage message={fieldState.error?.message} />
            </>
          );
        }}
      />
      <Controller
        name="emailCaptcha"
        rules={{
          required: "请输入邮箱验证码",
        }}
        render={({ field, fieldState }) => (
          <>
            <Input {...field} status={getAntdErrorStatus(fieldState)} placeholder="填写邮箱验证码" />
            <FormErrorMessage message={fieldState.error?.message} />
          </>
        )}
      />
    </>
  );
}
