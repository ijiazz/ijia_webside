import { FormErrorMessage } from "@/components/form.tsx";
import { css, cx } from "@emotion/css";
import { Checkbox } from "antd";
import { Controller } from "react-hook-form";

export function LoginFooter() {
  return (
    <div className={LoginFormFooterCSS}>
      <Controller
        name="keepLoggedIn"
        render={({ field, fieldState }) => (
          <Checkbox
            {...field}
            checked={field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            style={{ marginBottom: 8 }}
          >
            保留登录状态
          </Checkbox>
        )}
      />
      <Controller
        name="agreement"
        rules={{
          required: "请先关注佳佳子_zZ",
          validate: (value) => {
            if (!value) return "请先关注佳佳子_zZ";
            return undefined;
          },
        }}
        render={({ field, fieldState }) => (
          <div>
            <Checkbox {...field} checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
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
            <FormErrorMessage message={fieldState.error?.message} />
          </div>
        )}
      />
    </div>
  );
}
const LoginFormFooterCSS = css`
  .ant-checkbox-label {
    color: #fff;
  }
`;
