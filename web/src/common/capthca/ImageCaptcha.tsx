import { CaptchaPanel } from "@/common/capthca/captcha.tsx";
import { Modal, Popover, Spin } from "antd";
import { api, API_PREFIX } from "../http.ts";
import { useAsync } from "@/hooks/async.ts";
import { PropsWithChildren, useEffect, useState } from "react";
function useImageCaptcha(config: { onSubmit: (sessionId: string, selected: number[]) => void | Promise<void> }) {
  const {
    result: captchaResult,
    run: refresh,
    reset,
  } = useAsync(async (sessionId?: string) => {
    return api["/captcha/image"]
      .post({ params: { sessionId } })
      .then((res) => ({ ...res, imageUrlList: res.imageUrlList.map((item) => API_PREFIX + item) }));
  });
  const { result: submitResult, run: submit } = useAsync(async (selected: number[]) => {
    const sessionId = captchaResult.value!.sessionId;

    try {
      await config.onSubmit(sessionId, selected);
      reset();
    } catch (error) {
      refresh();
    }
  });

  return {
    captchaResult,
    submitResult,
    submit,
    refresh: () => refresh(captchaResult.value?.sessionId),
  };
}
export function ImageCaptchaPopover(props: PropsWithChildren<CaptchaPanelProps>) {
  const { open } = props;
  const { captchaResult, submit, refresh } = useImageCaptcha(props);
  const captchaQuestion = captchaResult.value;

  useEffect(() => {
    if (open && !captchaQuestion) refresh();
  }, [open]);
  return (
    <Popover
      open={open}
      content={
        <Spin spinning={captchaResult.loading}>
          <CaptchaPanel imageList={captchaQuestion?.imageUrlList ?? []} onChange={submit} />
        </Spin>
      }
    >
      {props.children}
    </Popover>
  );
}
type CaptchaPanelProps = {
  open: boolean;
  onCancel: () => void;
  onSubmit: (sessionId: string, selected: number[]) => void | Promise<void>;
};
export function ImageCaptchaModal(props: PropsWithChildren<CaptchaPanelProps>) {
  const { open } = props;
  const { captchaResult, submitResult, submit, refresh } = useImageCaptcha(props);
  const [selected, setSelected] = useState<number[]>([]);
  const captchaQuestion = captchaResult.value;
  useEffect(() => {
    if (open && !captchaQuestion) refresh();
  }, [open]);
  const imageList = captchaQuestion?.imageUrlList ?? [];
  const isError = captchaResult.error && !captchaResult.loading;
  return (
    <Modal
      maskClosable={false}
      title="验证码"
      open={open}
      onCancel={() => {
        setSelected([]);
        props.onCancel?.();
      }}
      width={365}
      cancelText="刷新"
      cancelButtonProps={{
        disabled: submitResult.loading || captchaResult.loading,
        onClick: () => {
          setSelected([]);
          refresh();
        },
      }}
      onOk={() => {
        submit(selected);
        setSelected([]);
      }}
      confirmLoading={submitResult.loading}
      okButtonProps={{ disabled: isError || captchaResult.loading }}
    >
      <Spin spinning={captchaResult.loading}>
        <h4>{captchaQuestion?.title}</h4>

        <CaptchaPanel
          imageList={imageList}
          value={selected}
          onChange={setSelected}
          errorMessage="验证码获取失败"
          isError={isError}
        />
      </Spin>
    </Modal>
  );
}
