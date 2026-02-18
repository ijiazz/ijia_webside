import { useThemeToken } from "@/provider/mod.tsx";
import { css, cx } from "@emotion/css";
import { InputStatus } from "antd/es/_util/statusUtils.js";
import { ControllerFieldState } from "react-hook-form";

export type FormItemLabelProps = {
  required?: boolean;
  label?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};
export function FormItemLabel(props: FormItemLabelProps) {
  const { label, required, ...rest } = props;
  const theme = useThemeToken();
  return (
    <div {...rest} style={{ fontSize: 14, color: theme.colorText, marginBottom: 3, ...rest.style }}>
      {required && <span style={{ color: theme.colorError }}> *</span>}
      <label>{label}</label>
    </div>
  );
}

export type FormErrorMessageProps = {
  message?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export function FormErrorMessage(props: FormErrorMessageProps) {
  const { message, style, className } = props;

  const theme = useThemeToken();

  return (
    <div
      style={{
        color: theme.colorError,
        fontSize: theme.fontSize,
        visibility: message ? "visible" : "hidden",
        ...style,
      }}
      className={cx(FormErrorMessageCSS, className)}
      aria-errormessage={message}
    >
      {message}
    </div>
  );
}

const FormErrorMessageCSS = css`
  margin-top: 0;
  margin-bottom: 3px;
  height: 1.5em;
  line-height: 1.5em;
`;

export function getAntdErrorStatus(fieldState: ControllerFieldState): InputStatus | undefined {
  if (fieldState.isValidating) return "validating";
  if (fieldState.error) return "error";
  return undefined;
}

export interface FormItemProps {
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  layout?: "horizontal" | "vertical";

  children?: React.ReactNode;

  style?: React.CSSProperties;
  className?: string;
  classNames?: { label?: string; errorMessage?: string; content?: string };
}
export function FormItem(props: FormItemProps) {
  const { error, layout, label, required, classNames = {}, children, ...rest } = props;
  return (
    <div {...rest}>
      <div className={classNames.content} style={{ display: layout === "horizontal" ? "flex" : "block", gap: 8 }}>
        <FormItemLabel required={required} label={label} className={classNames.label} />
        {children}
      </div>
      <FormErrorMessage message={error} className={classNames.errorMessage} />
    </div>
  );
}
