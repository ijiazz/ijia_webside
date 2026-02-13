import { useThemeToken } from "@/provider/mod.tsx";
import { InputStatus } from "antd/es/_util/statusUtils.js";
import { ControllerFieldState } from "react-hook-form";

export type FormItemProps = {
  message?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export function FormErrorMessage(props: FormItemProps) {
  const { message, style, className } = props;

  const theme = useThemeToken();

  return (
    <div
      style={{
        color: theme.colorError,
        fontSize: theme.fontSize,
        visibility: message ? "visible" : "hidden",
        height: "1.5em",
        lineHeight: "1.5em",
        ...style,
      }}
      className={className}
      aria-errormessage={message}
    >
      {message}
    </div>
  );
}
export function getAntdErrorStatus(fieldState: ControllerFieldState): InputStatus | undefined {
  if (fieldState.isValidating) return "validating";
  if (fieldState.error) return "error";
  return undefined;
}
