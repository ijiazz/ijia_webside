import { CurrentIdCard } from "@/common/StudentIdCard.tsx";
import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Avatar, Button, Checkbox, Form, message, Modal, Popover, Select, Space, Tooltip, Typography } from "antd";
import { useMemo, useState } from "react";
import { PlatformBind } from "../components/PlatformBind.tsx";
import { useCurrentUser, UserProfileBasic } from "@/common/user.ts";
import { Platform } from "@/common/third_part_account.tsx";
import styled from "@emotion/styled";
import { Meta } from "@/lib/components/Meta.tsx";

export function BasicInfoPage() {
  const { refresh } = useCurrentUser();
  const accounts: ThirdPartAccountBind[] = [
    {
      key: "1",
      lastUpdate: new Date().toString(),
      pla_uid: "plauid",
      platform: Platform.douYin,
      user_id: 1,
      platformIcon: "",
      userName: "ABC",
    },
    {
      key: "2",
      lastUpdate: new Date().toString(),
      pla_uid: "plauid",
      platform: Platform.douYin,
      user_id: 1,
      platformIcon: "",
      userName: "ABC",
    },
  ];
  return (
    <div>
      <CurrentIdCard />
      <BindAccountList accounts={accounts} />
      <BasicForm accounts={accounts} afterUpdate={() => refresh()} />
    </div>
  );
}

type BasicFormData = {
  received_live: boolean | null;
  publicClassId: number | null;
};
function BasicForm(props: { accounts: ThirdPartAccountBind[]; afterUpdate?(): void }) {
  const { accounts, afterUpdate } = props;
  const [form] = Form.useForm<BasicFormData>();
  const [defaultData, setDefaultData] = useState<BasicFormData>({ publicClassId: null, received_live: null });
  const [isChanged, setIsChanged] = useState(false);
  const { api } = useHoFetch();
  const accountOption = useMemo(() => {
    return accounts.map((item) => ({
      label: (
        <Space>
          {item.platformIcon}
          {item.userName}
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

function isEqual(obj1: any, obj2: any) {
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== "object" || obj1 === null || obj2 === null) return obj1 === obj2;
  const key1 = Object.keys(obj1);
  const key2 = Object.keys(obj2);
  if (key2 !== key1) return false;
  const key2Set = new Set(key2);
  for (const key of key1) {
    if (!key2Set.has(key)) {
      if (key === undefined) continue;
      return false;
    }
    if (!isEqual(obj1[key], obj2[key])) return false;
    key2Set.delete(key);
  }
  if (key2Set.size) return false;
  return true;
}
function BindAccountList(props: { accounts?: ThirdPartAccountBind[]; user?: UserProfileBasic; afterChange?(): void }) {
  const { accounts, user, afterChange: onAccountChange } = props;
  const { api } = useHoFetch();
  const { run: onRemoveBind, result: removeBindResult } = useAsync(async (item: ThirdPartAccountBind) => {
    await api["/user/bind_platform"].delete({ body: { bindKeyList: [item.key] } });
    message.success("已解除");
    onAccountChange?.();
  });
  const [confirmOpen, setConfirmOpen] = useState<{ title: string; item: ThirdPartAccountBind } | undefined>();
  const [isAddBind, setIsAddBind] = useState(false);
  return (
    <BindAccountListCSS>
      <Typography.Title level={5}>账号绑定</Typography.Title>
      <div className="bind-list">
        <Avatar.Group>
          {accounts?.map((account) => {
            return (
              <Popover
                key={account.key}
                content={
                  <div>
                    <Meta icon={account.platformIcon} title={account.userName}></Meta>
                    <Button
                      loading={removeBindResult.loading}
                      disabled={account.isPrimary}
                      size="small"
                      onClick={() => setConfirmOpen({ title: "确认解除关联？", item: account })}
                    >
                      解除关联
                    </Button>
                  </div>
                }
              >
                <Avatar key={account.key} alt={account.userName} src={account.userAvatarUrl}></Avatar>
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
type ThirdPartAccountBind = {
  platform: Platform;
  pla_uid: string;
  user_id: number;
  key: string;
  isPrimary?: boolean;
  platformIcon?: string;
  userName: string;
  userAvatarUrl?: string | null;

  lastUpdate?: string;
};
