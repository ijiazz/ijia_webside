import { FormErrorMessage, getAntdErrorStatus } from "@/components/form.tsx";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { Controller } from "react-hook-form";

export function PasswordLoginForm() {
  return (
    <>
      <Controller
        name="user"
        rules={{
          required: "请输入学号或邮箱",
          pattern: { value: /^((\d+)|([^@]+@.+?\..+))$/, message: "请输入正确的学号或邮箱" },
        }}
        render={({ field, fieldState }) => (
          <>
            <Input
              {...field}
              status={getAntdErrorStatus(fieldState)}
              prefix={<UserOutlined />}
              placeholder="学号或邮箱"
            />
            <FormErrorMessage message={fieldState.error?.message} />
          </>
        )}
      />
      <Controller
        name="password"
        rules={{}}
        render={({ field, fieldState }) => (
          <>
            <Input.Password
              {...field}
              status={getAntdErrorStatus(fieldState)}
              prefix={<LockOutlined />}
              placeholder="密码"
            />
            <FormErrorMessage message={fieldState.error?.message} />
          </>
        )}
      />
    </>
  );
}
