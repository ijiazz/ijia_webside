import { Button, Input, InputProps, Tooltip } from "antd";
import React, { useRef, useState } from "react";
import { ImageCaptchaPopover } from "@/common/capthca/ImageCaptcha.tsx";
function useCooling(coolingTime = 60) {
  const [time, settime] = useState<number>(0);
  const ref = useRef<null | number>(null);

  const start = () => {
    if (ref.current) clearInterval(ref.current);
    settime(coolingTime);
    const id = setInterval(() => {
      settime((time) => {
        if (time - 1 === 0) clearInterval(id);
        return time - 1;
      });
    }, 1000) as any as number;
    ref.current = id;
  };
  return {
    time,
    start,
  };
}

export function EmailInput(
  props: Pick<InputProps, "placeholder" | "disabled" | "prefix" | "suffix" | "status"> & {
    value?: string;
    disabled?: boolean;
    disabledInput?: boolean;
    onChange?(value: string): void;
    onCaptchaSubmit: (email: string, sessionId: string, selected: number[]) => Promise<void>;
    sendBtnText?: string;
  },
) {
  const { disabled, disabledInput, sendBtnText = "发送验证码", ...reset } = props;
  const cooling = useCooling(30);
  const [email, setValue] = useState<string | undefined>();

  const value = props.value ?? email;
  const emailIsValid = /[^@]+?@[^@]+/.test(value ?? "");

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Input
        {...reset}
        value={value}
        disabled={disabledInput || disabled}
        onChange={(e) => {
          setValue(e.currentTarget.value);
          props.onChange?.(e.currentTarget.value);
        }}
      />
      <ImageCaptchaPopover
        disabled={!emailIsValid}
        onSubmit={(sessionId, select) => {
          return props.onCaptchaSubmit?.(email!, sessionId, select).then(cooling.start);
        }}
      >
        <Tooltip title="如果收不到验证码，可以试试查看垃圾箱">
          <Button disabled={!emailIsValid || cooling.time > 0 || props.disabled}>
            {sendBtnText}
            {cooling.time > 0 ? `${cooling.time}` : undefined}
          </Button>
        </Tooltip>
      </ImageCaptchaPopover>
    </div>
  );
}
