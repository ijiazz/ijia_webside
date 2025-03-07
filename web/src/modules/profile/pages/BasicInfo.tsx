import { api } from "@/common/http.ts";
import { useAsync } from "@/hooks/async.ts";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Avatar, Button, Form, Input, Select, Tooltip } from "antd";

import { useThrottle } from "react-use";
export function BasicInfoPage() {
  return (
    <div>
      <Tk />
      <BasicForm />
    </div>
  );
}

function Tk() {
  const [form] = Form.useForm();
  const accounts: ThirdPartAccountBind[] = [];
  return (
    <div>
      {accounts.map((account) => {
        return (
          <div>
            {account.platformIcon}
            {account.userName}
            <Button>解除关联</Button>
          </div>
        );
      })}
      <Form form={form}>
        <Form.Item label="关联账号">
          <Input></Input>
        </Form.Item>
      </Form>
    </div>
  );
}
function BasicForm() {
  const [form] = Form.useForm();
  return (
    <div>
      基础信息
      <Avatar />
      <Form form={form}>
        <Form.Item>
          <Input></Input>
        </Form.Item>
        <Form.Item
          label={
            <>
              班级
              <Tooltip title="">
                <QuestionCircleOutlined />
              </Tooltip>
            </>
          }
        >
          <ClassSelect />
        </Form.Item>
        <Form.Item></Form.Item>
      </Form>
    </div>
  );
}
function ClassSelect(props: { value?: number; onChange?(value: number): void }) {
  const { result, run } = useAsync(async function (search?: string) {
    console.log(search);

    return [];
  });
  const getOption = useThrottle(run, 800);

  return (
    <Select
      value={props.value}
      onChange={props.onChange}
      allowClear
      showSearch
      options={result.value}
      loading={result.loading}
      onSearch={(value) => getOption(value)}
      filterOption={false}
    />
  );
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
