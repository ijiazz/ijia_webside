import { CaptchaPanel } from "@/components/captcha.tsx";
import { Modal, Popover } from "antd";
import { api } from "./http.ts";
import { useAsync } from "@/hooks/useAsync.ts";
import { PropsWithChildren, useContext, useEffect } from "react";
import { antdStatic } from "@/hooks/antd-static.ts";
function useImageCaptcha(config: { onSubmit: (sessionId: string, selected: number[]) => Promise<void> }) {
  const { message } = useContext(antdStatic);
  const {
    loading,
    run: refresh,
    error,
    result,
  } = useAsync(async () => {
    return api["/captcha/image"].post();
  });
  const { loading: submitLoading, run: submit } = useAsync(async (selected: number[]) => {
    try {
      await config.onSubmit(result!.sessionId, selected);
    } catch (error) {
      message.error("验证码错误");
      await refresh();
    }
  });
  useEffect(() => {
    if (!result) refresh();
  }, [open]);

  return { captchaQuestion: result, loading, submitLoading, submit, refresh };
}
export function ImageCaptchaPopover(props: PropsWithChildren<CaptchaPanelProps>) {
  const { open } = props;
  const { loading, submit, submitLoading, captchaQuestion } = useImageCaptcha(props);
  return (
    <Popover
      open={open}
      content={
        <CaptchaPanel
          loading={loading}
          imageList={captchaQuestion?.imageUrlList ?? []}
          confirmLoading={submitLoading}
          onChange={submit}
        />
      }
    >
      {props.children}
    </Popover>
  );
}
type CaptchaPanelProps = {
  open: boolean;
  onCancel: () => void;
  onSubmit: (sessionId: string, selected: number[]) => Promise<void>;
};
export function ImageCaptchaModal(props: PropsWithChildren<CaptchaPanelProps>) {
  const { open } = props;
  const { loading, submit, submitLoading, captchaQuestion } = useImageCaptcha(props);
  return (
    <Modal open={open} onCancel={props.onCancel} onOk={() => {}}>
      <CaptchaPanel
        loading={loading}
        imageList={captchaQuestion?.imageUrlList ?? []}
        confirmLoading={submitLoading}
        onChange={submit}
      />
    </Modal>
  );
}
