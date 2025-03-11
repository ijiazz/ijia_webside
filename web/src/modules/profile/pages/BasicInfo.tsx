import { CurrentIdCard } from "@/common/StudentIdCard.tsx";
import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Select, Space, Tooltip } from "antd";
import { useState } from "react";
import { PlatformBind } from "../components/PlatformBind.tsx";
export function BasicInfoPage() {
  return (
    <div>
      <PlatformAccount />
      <BasicForm />
    </div>
  );
}

function BasicForm() {
  const [form] = Form.useForm();
  const accounts: ThirdPartAccountBind[] = [];
  return (
    <div>
      <Form form={form} disabled={accounts.length === 0}>
        <Form.Item label="切换主账号">
          <Select disabled={accounts.length <= 1}></Select>
        </Form.Item>
        <Form.Item
          label={
            <Space>
              班级
              <Tooltip title="">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }
        >
          <PublicClassSelect />
        </Form.Item>
        <Form.Item label={null} name="option" valuePropName="checked">
          <Checkbox>
            <Space>
              接收直播通知
              <Tooltip title="校长直播时，将通过邮件发送通知">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          </Checkbox>
        </Form.Item>
      </Form>
    </div>
  );
}
function PlatformAccount() {
  const accounts: ThirdPartAccountBind[] = [];
  const isBind = accounts.length > 0;
  const [isAddBind, setIsAddBind] = useState(false);
  return (
    <div>
      <CurrentIdCard isBind={isBind} />
      {accounts.map((account) => {
        return (
          <div>
            {account.platformIcon}
            {account.userName}
            <Button>解除关联</Button>
          </div>
        );
      })}
      {isBind || "部分信息需要绑定平台账号后才能修改"}
      {(!isBind || isAddBind) && <PlatformBind onBindSuccess={() => setIsAddBind(false)} />}
    </div>
  );
}
function PublicClassSelect(props: { value?: number; onChange?(value: number): void }) {
  const api = useHoFetch().api;
  const { result } = useAsync(
    async function (search?: string) {
      const { items } = await api["/class/public"].get();
      return items.map((item) => ({ label: item.class_name, value: item.class_id }));
    },
    { autoRunArgs: [] },
  );
  return <Select {...props} style={{ minWidth: 100, maxWidth: 200 }} allowClear options={result.value} />;
}
type ThirdPartAccountBind = {
  platformName: string;
  platformIcon: string;
  platform: number;
  pla_uid: string;
  userName: string;

  lastUpdate: string;

  key: string;
};
