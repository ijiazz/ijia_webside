import { useAsync } from "@/hooks/async.ts";
import { Button, Form, Input, Modal, Select } from "antd";
import React, { useEffect, useState } from "react";
import { PRESET_REASON } from "./preset_reason.ts";

export function ReportModal(props: {
  open?: boolean;
  onClose?: () => void;
  onSubmit?: (reason: string) => Promise<void>;

  title?: string;
}) {
  const { onClose, onSubmit, open, title = "举报" } = props;
  const { loading, run } = useAsync((reason: string) => onSubmit?.(reason));
  const [selected, setSelected] = useState<string | number | undefined>();
  const [form] = Form.useForm<{ reason: string | number; remark?: string }>();
  const reason = Form.useWatch("reason", form);
  useEffect(() => {
    if (open) form.resetFields();
  }, [open]);
  return (
    <Modal title={title} open={open} onCancel={onClose} footer={null}>
      <Form
        form={form}
        labelCol={{ span: 4 }}
        onFinish={(values) => {
          const reason = values.remark ? `${values.reason}:${values.remark}` : (values.reason as string);
          run(reason);
        }}
      >
        <Form.Item name="reason" label="举报理由" required rules={[{ required: true }]}>
          <Select placeholder="选择原因" options={PRESET_REASON} onChange={setSelected} value={selected} />
        </Form.Item>
        <Form.Item
          name="remark"
          label="补充说明"
          dependencies={["reason"]}
          required={reason === 1}
          rules={[{ required: reason === 1 }]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Button onClick={onClose}>取消</Button>
          <Button loading={loading} type="primary" htmlType="submit" style={{ marginLeft: 8 }}>
            确定
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
