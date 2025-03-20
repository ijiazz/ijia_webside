import { Button, Form, Input } from "antd";
import { useRef, useState } from "react";
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
    }, 1000);
    ref.current = id;
  };
  return {
    time,
    start,
  };
}

export function EmailInput(props: {
  value?: string;
  disabled?: boolean;
  onChange?(value: string): void;
  onCaptchaSubmit: (email: string, sessionId: string, selected: number[]) => Promise<void>;
}) {
  const cooling = useCooling();
  const form = Form.useFormInstance();
  const email: string | undefined = Form.useWatch("email", form);
  const emailIsValid = /[^@]+?@[^@]+/.test(email ?? "");
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Input {...props} onChange={(e) => props.onChange?.(e.currentTarget.value)} />
      <ImageCaptchaPopover
        disabled={!emailIsValid}
        onSubmit={(sessionId, select) => {
          return props.onCaptchaSubmit?.(email!, sessionId, select).then(cooling.start);
        }}
      >
        <Button disabled={!emailIsValid || cooling.time > 0 || props.disabled}>
          发送验证码{cooling.time > 0 ? `${cooling.time}` : undefined}
        </Button>
      </ImageCaptchaPopover>
    </div>
  );
}
