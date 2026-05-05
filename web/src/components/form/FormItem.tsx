import { useThemeToken } from "@/provider/mod.tsx";
import { QuestionOutlined } from "@ant-design/icons";
import { css, cx } from "@emotion/css";
import { Tooltip } from "antd";
import { InputStatus } from "antd/es/_util/statusUtils.js";
import { isValidElement, ReactNode } from "react";
import { ControllerFieldState } from "react-hook-form";

export type FormItemLabelProps = {
  required?: boolean;
  label?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;

  description?: string | { label: string; tooltip?: ReactNode | boolean };
};
export function FormItemLabel(props: FormItemLabelProps) {
  const { label, required, description, ...rest } = props;
  const theme = useThemeToken();
  return (
    <div {...rest} style={{ display: "flex", alignItems: "center", marginBottom: 3, ...rest.style }}>
      {required && <span style={{ fontSize: 14, color: theme.colorError }}> *</span>}
      <label style={{ fontSize: 14, color: theme.colorText, marginRight: "0.5em" }}>{label}</label>
      {(() => {
        if (!description) return null;
        const desc = typeof description === "string" ? { label: description } : description;

        if (isValidElement(desc)) {
          return desc;
        } else if (typeof desc === "object") {
          if ("tooltip" in desc && desc.tooltip) {
            return (
              <Tooltip title={desc.label}>
                {typeof desc.tooltip === "boolean" ? <QuestionOutlined /> : desc.tooltip}
              </Tooltip>
            );
          } else if ("label" in desc) {
            return (
              <div
                style={{
                  fontSize: theme.fontSizeSM,
                  color: theme.colorTextTertiary,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {desc.label}
              </div>
            );
          }
        }
      })()}
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
  description?:
    | string
    | {
        label: string;
        tooltip?: boolean;
      };
  rightSelection?: React.ReactNode;
}
export function FormItem(props: FormItemProps) {
  const { error, layout, label, required, classNames = {}, children, rightSelection, description, ...rest } = props;

  const theme = useThemeToken();
  return (
    <div {...rest}>
      <div className={classNames.content} style={{ display: layout === "horizontal" ? "flex" : "block", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <FormItemLabel required={required} label={label} className={classNames.label} description={description} />
          {rightSelection || <div />}
        </div>
        {children}
      </div>
      <FormErrorMessage message={error} className={classNames.errorMessage} />
    </div>
  );
}
