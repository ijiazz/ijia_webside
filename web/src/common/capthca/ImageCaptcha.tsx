import { CaptchaPanel } from "@/common/capthca/captcha.tsx";
import { Modal, Popover, Spin, Button } from "antd";
import { useAsync } from "@/hooks/async.ts";
import React, { PropsWithChildren, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { useHoFetch } from "@/hooks/http.ts";

function useImageCaptcha(config: { onSubmit?: (sessionId: string, selected: number[]) => void | Promise<void> }) {
  const { api, API_PREFIX } = useHoFetch();
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
      await config.onSubmit?.(sessionId, selected);
      reset();
    } catch (error) {
      refresh(sessionId);
    }
  });

  return {
    captchaResult,
    submitResult,
    submit,
    refresh: () => refresh(captchaResult.value?.sessionId),
  };
}
export type ImageCaptchaPopoverProps = PropsWithChildren<{
  onCancel?: () => void;
  onSubmit?: (sessionId: string, selected: number[]) => void | Promise<void>;
  disabled?: boolean;
}>;
export function ImageCaptchaPopover(props: ImageCaptchaPopoverProps) {
  const { disabled } = props;
  const { captchaResult, submitResult, submit, refresh } = useImageCaptcha({
    async onSubmit(sessionId, selected) {
      await props.onSubmit?.(sessionId, selected);
      setOpen(false);
    },
  });
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const captchaQuestion = captchaResult.value;

  const isError = captchaResult.error && !captchaResult.loading;
  useEffect(() => {
    if (open && !captchaQuestion) refresh();
  }, [open]);
  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (open === false) props.onCancel?.();
      }}
      content={
        <CssImageCaptchaPopover>
          <Spin spinning={captchaResult.loading}>
            <CaptchaPanel
              value={selected}
              title={captchaQuestion?.title}
              imageList={captchaQuestion?.imageUrlList ?? []}
              onChange={setSelected}
              isError={isError}
            />
            <div className="footer" style={{ display: "flex", gap: 12, justifyContent: "end" }}>
              <Button
                disabled={disabled || submitResult.loading}
                onClick={() => {
                  refresh();
                  setSelected([]);
                }}
                size="small"
              >
                刷新
              </Button>
              <Button
                disabled={disabled}
                loading={submitResult.loading}
                type="primary"
                size="small"
                onClick={() => {
                  submit(selected);
                  setSelected([]);
                }}
              >
                确定
              </Button>
            </div>
          </Spin>
        </CssImageCaptchaPopover>
      }
    >
      {props.children}
    </Popover>
  );
}

const CssImageCaptchaPopover = styled.div`
  .footer {
    margin-top: 12px;
  }
`;
type ImageCaptchaModal = {
  open?: boolean;
  onCancel?: () => void;
  onSubmit?: (sessionId: string, selected: number[]) => void | Promise<void>;
};
export function ImageCaptchaModal(props: PropsWithChildren<ImageCaptchaModal>) {
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
        <CaptchaPanel
          title={captchaQuestion?.title}
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
