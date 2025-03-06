import { CaptchaPanel } from "@/components/captcha.tsx";
import { Button, Modal, Popover, Space, Spin } from "antd";
import { api, API_PREFIX } from "./http.ts";
import { useAsync } from "@/hooks/useAsync.ts";
import { PropsWithChildren, useContext, useEffect, useState } from "react";
import { antdStatic } from "@/hooks/antd-static.ts";
function useImageCaptcha(config: { onSubmit: (sessionId: string, selected: number[]) => Promise<void> }) {
  const { message } = useContext(antdStatic);
  const {
    loading,
    run: refresh,
    error,
    result,
  } = useAsync(async (sessionId?: string) => {
    return api["/captcha/image"]
      .post({ params: { sessionId } })
      .then((res) => ({ ...res, imageUrlList: res.imageUrlList.map((item) => API_PREFIX + item) }));
  });
  const { loading: submitLoading, run: submit } = useAsync(async (selected: number[]) => {
    const sessionId = result!.sessionId;
    try {
      await config.onSubmit(sessionId, selected);
    } catch (error) {
      message.error("验证码错误");
      await refresh();
    }
  });

  return { captchaQuestion: result, loading, submitLoading, submit, refresh: () => refresh(result?.sessionId) };
}
export function ImageCaptchaPopover(props: PropsWithChildren<CaptchaPanelProps>) {
  const { open } = props;
  const { loading, submit, submitLoading, captchaQuestion, refresh } = useImageCaptcha(props);

  useEffect(() => {
    if (open && !captchaQuestion) refresh();
  }, [open]);
  return (
    <Popover
      open={open}
      content={
        <Spin spinning={loading}>
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
  onSubmit: (sessionId: string, selected: number[]) => Promise<void>;
};
export function ImageCaptchaModal(props: PropsWithChildren<CaptchaPanelProps>) {
  const { open } = props;
  const { loading, submit, submitLoading, captchaQuestion, refresh } = useImageCaptcha(props);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (open && !captchaQuestion) refresh();
  }, [open]);
  return (
    <Modal maskClosable={false} title="验证码" open={open} onCancel={props.onCancel} width={"400px"} footer={false}>
      <h4>请选择包含佳佳子的图片</h4>
      <Spin spinning={loading}>
        <CaptchaPanel imageList={captchaQuestion?.imageUrlList ?? []} value={selected} onChange={setSelected} />
        <Space align="center">
          <Button onClick={refresh} disabled={submitLoading}>
            刷新
          </Button>
          <Button type="primary" onClick={() => submit(selected)} loading={submitLoading}>
            确定
          </Button>
        </Space>
      </Spin>
    </Modal>
  );
}
