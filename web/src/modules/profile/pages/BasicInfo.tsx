import { CurrentIdCard } from "@/common/StudentIdCard.tsx";
import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Avatar, Button, Checkbox, Form, message, Modal, Popover, Select, Space, Tooltip, Typography } from "antd";
import { useMemo, useState } from "react";
import { PlatformBind } from "../components/PlatformBind.tsx";
import { useCurrentUser } from "@/common/user.ts";
import styled from "@emotion/styled";
import { Meta } from "@/lib/components/Meta.tsx";
import { isEqual } from "@/lib/object.ts";
import { BindAccountDto } from "@/api.ts";

export function BasicInfoPage() {
  const { refresh: afterUpdate, value } = useCurrentUser();
  const accounts = useMemo((): ThirdPartAccountBind[] => {
    if (!value?.bind_accounts) return [];

    return value.bind_accounts.map((item) => {
      return {
        ...item,
      };
    });
  }, [value?.bind_accounts]);
  return (
    <div>
      <CurrentIdCard />
      <BindAccountList accounts={accounts} />
      <BasicForm accounts={accounts} />
    </div>
  );
}

type BasicFormData = {
  received_live: boolean | null;
  publicClassId: number | null;
};
function BasicForm(props: { accounts: ThirdPartAccountBind[] }) {
  const { accounts } = props;

  const { refresh: afterUpdate } = useCurrentUser();
  const [form] = Form.useForm<BasicFormData>();
  const [defaultData, setDefaultData] = useState<BasicFormData>({ publicClassId: null, received_live: null });
  const [isChanged, setIsChanged] = useState(false);
  const { api } = useHoFetch();

  const accountOption = useMemo(() => {
    return accounts.map((item) => ({
      label: (
        <Space>
          {item.platformIcon}
          {item.user_name}
        </Space>
      ),
      value: item.key,
    }));
  }, [accounts]);
  const { run: onUpdate, result } = useAsync(async function () {
    const formData = await form.validateFields();
    await api["/user/profile"].patch({
      body: {
        notice: {
          live: formData.received_live ?? undefined,
        },
        publicClassId: formData.publicClassId,
      },
    });
    message.success("已修改");
    console.log("已修改");
    setDefaultData(formData);
    setIsChanged(false);
    afterUpdate?.();
  });

  return (
    <div>
      <Space size="large" align="baseline">
        <Typography.Title level={5}>基础设置</Typography.Title>
        {isChanged && (
          <Space>
            <Button
              size="small"
              onClick={() => {
                form.setFieldsValue(defaultData);
                setIsChanged(false);
              }}
            >
              取消
            </Button>
            <Button size="small" onClick={onUpdate} type="primary">
              保存
            </Button>
          </Space>
        )}
      </Space>
      {accounts.length > 0 || <div>部分信息需要绑定平台账号后才能修改</div>}
      <Form
        form={form}
        disabled={accounts.length === 0}
        onValuesChange={(value, values) => {
          setIsChanged(!isEqual(values, defaultData));
        }}
      >
        <Form.Item label="切换主账号">
          <Select disabled={accounts.length <= 1} options={accountOption}></Select>
        </Form.Item>
        <Form.Item
          name="publicClassId"
          label={
            <Space>
              班级
              <Tooltip title="一个学期只能修改一次">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }
        >
          <PublicClassSelect />
        </Form.Item>
        <Form.Item label={null} name="received_live" valuePropName="checked">
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

function BindAccountList(props: { accounts?: ThirdPartAccountBind[] }) {
  const { accounts } = props;

  const { refresh: onAccountChange, value: user } = useCurrentUser();
  const { api } = useHoFetch();
  const { run: onRemoveBind, result: removeBindResult } = useAsync(async (item: BindAccountDto) => {
    await api["/user/bind_platform"].delete({ body: { bindKey: item.key } });
    message.success("已解除");
    onAccountChange?.();
  });
  const { run: refreshAccount, result: refreshAccountResult } = useAsync(async (item: BindAccountDto) => {
    await api["/user/profile/sync"].post({ body: { bindKey: item.key } });
    message.success("已更新");
    onAccountChange?.();
  });
  const [confirmOpen, setConfirmOpen] = useState<{ title: string; item: BindAccountDto } | undefined>();
  const [isAddBind, setIsAddBind] = useState(false);
  return (
    <BindAccountListCSS>
      <Typography.Title level={5}>账号绑定</Typography.Title>
      <div className="bind-list">
        <Avatar.Group>
          {accounts?.map((account) => {
            const key = account.key;
            return (
              <Popover
                key={key}
                content={
                  <div>
                    <Meta icon={account.avatar_url} title={account.user_name}></Meta>
                    <Space>
                      <Button
                        size="small"
                        loading={refreshAccountResult.loading}
                        onClick={() => refreshAccount(account)}
                      >
                        更新信息
                      </Button>
                      <Button
                        loading={removeBindResult.loading}
                        size="small"
                        onClick={() => setConfirmOpen({ title: "确认解除关联？", item: account })}
                      >
                        解除关联
                      </Button>
                    </Space>
                  </div>
                }
              >
                <Avatar key={key} alt={account.user_name ?? ""} src={account.avatar_url}></Avatar>
              </Popover>
            );
          })}
        </Avatar.Group>
        <Button icon={<PlusOutlined />} onClick={() => setIsAddBind(true)}>
          添加绑定
        </Button>
      </div>
      <Modal
        open={confirmOpen !== undefined}
        title={confirmOpen?.title}
        okButtonProps={{ loading: removeBindResult.loading }}
        onOk={() => {
          if (!confirmOpen) return;
          onRemoveBind(confirmOpen.item).then(() => {
            setConfirmOpen(undefined);
          });
        }}
        onCancel={() => setConfirmOpen(undefined)}
      ></Modal>
      <Modal maskClosable={false} title="添加绑定" open={isAddBind} onCancel={() => setIsAddBind(false)} footer={false}>
        <PlatformBind
          userId={user?.user_id}
          onBindSuccess={() => {
            setIsAddBind(false);
            onAccountChange?.();
          }}
        />
      </Modal>
    </BindAccountListCSS>
  );
}

const BindAccountListCSS = styled.div`
  .bind-list {
    gap: 12px;
    display: flex;
    align-items: center;
  }
`;

function PublicClassSelect(props: { value?: number; onChange?(value: number): void }) {
  const api = useHoFetch().api;
  const { result } = useAsync(
    async function (search?: string) {
      const { items } = await api["/class/public"].get();
      return items.map((item) => ({
        ...item,
        label: (
          <Space>
            <span>{item.class_name}</span>
            {item.description ? <span>({item.description})</span> : undefined}
          </Space>
        ),
        value: item.class_id,
      }));
    },
    { autoRunArgs: [] },
  );
  return (
    <Select
      {...props}
      style={{ minWidth: 100, maxWidth: 200 }}
      allowClear
      options={result.value}
      showSearch
      filterOption={(value, option) => {
        if (!option) return false;
        return option.class_name.toUpperCase().includes(value.toUpperCase());
      }}
    />
  );
}
type ThirdPartAccountBind = BindAccountDto & {
  platformIcon?: string;
};
