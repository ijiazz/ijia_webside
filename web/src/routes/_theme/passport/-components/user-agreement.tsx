import { Modal, Radio } from "antd";
import React, { useState } from "react";

export function UserAgreementModal(props: { open?: boolean; onClose?(agree?: boolean): void; needAgree?: boolean }) {
  const { needAgree } = props;
  const [isAgree, setIsAgree] = useState(false);
  return (
    <Modal title="IJIA 学院用户协议" open={props.open} destroyOnClose onCancel={() => props.onClose?.(isAgree)}>
      <UserAgreement />
      {needAgree && (
        <Radio.Group onChange={(e) => setIsAgree(e.target.value)} value={isAgree}>
          <Radio value={false}>我不同协议</Radio>
          <Radio value={true}>我已阅读并同意协议</Radio>
        </Radio.Group>
      )}
    </Modal>
  );
}

//TODO: 完成用户协议
export function UserAgreement() {
  return <div>TOOD 用户协议</div>;
}
