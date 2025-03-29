import { CurrentIdCard } from "@/common/StudentIdCard.tsx";
import { useAsync, UseAsyncResult } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Checkbox,
  Form,
  message,
  Modal,
  Popover,
  Select,
  Space,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { PlatformBind } from "../components/PlatformBind.tsx";
import { useCurrentUser } from "@/common/user.ts";
import styled from "@emotion/styled";
import { Meta } from "@/lib/components/Meta.tsx";
import { BindAccountDto, UserProfileDto } from "@/api.ts";
import { toFileUrl } from "@/common/http.ts";
import { PagePadding } from "@/lib/components/Page.tsx";

export function BasicInfoPage() {
  const { api } = useHoFetch();
  const { result, run } = useAsync(
    () => {
      return api["/user/profile"].get().then((res) => ({
        ...res,
        bind_accounts: res.bind_accounts.map((item) => ({ ...item, avatar_url: toFileUrl(item.avatar_url) })),
      }));
    },
    { autoRunArgs: [] },
  );

  return (
    <PagePadding>
      <CurrentIdCard />
      <BindAccountList profileResult={result} onProfileChange={() => run()} />
      <BasicForm profileResult={result} onProfileChange={() => run()} />
    </PagePadding>
  );
}

type BasicFormData = {
  received_live?: boolean | null;
  primary_class_id?: number | null;
};
function BasicForm(props: { profileResult: UseAsyncResult<UserProfileDto>; onProfileChange?(): void }) {
  const { profileResult, onProfileChange } = props;
  const profile = profileResult.value;

  const { api } = useHoFetch();
  const { refresh: afterUpdate } = useCurrentUser();
  const [form] = Form.useForm<BasicFormData>();
  const [isChanged, setIsChanged] = useState(false);

  const defaultData = useMemo(() => {
    let defaultData: BasicFormData = {};
    if (profile) {
      defaultData = {
        received_live: profile.notice_setting?.live ?? false,
        primary_class_id: profile.primary_class?.class_id ?? null,
      };
    }
    return defaultData;
  }, [profile]);
  useEffect(() => {
    form.setFieldsValue(defaultData);
  }, [defaultData]);

  const { run: onUpdate, result } = useAsync(async function () {
    const formData = await form.validateFields();
    await api["/user/profile"].patch({
      body: {
        notice_setting: {
          live: formData.received_live,
        },
        primary_class_id: formData.primary_class_id === undefined ? null : formData.primary_class_id,
      },
    });
    message.success("已修改");
    setIsChanged(false);
    onProfileChange?.();
    afterUpdate?.();
  });

  return (
    <div>
      <Spin spinning={profileResult.loading}>
        <Space size="large" align="baseline">
          <Typography.Title level={5}>基础设置</Typography.Title>
          {isChanged && (
            <Space>
              <Button
                size="small"
                onClick={() => {
                  form.setFieldsValue(defaultData ?? {});
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
        {profile?.is_official || <div>部分信息需要绑定平台账号后才能修改</div>}
        <Form
          form={form}
          disabled={!profile?.is_official}
          onValuesChange={(value, values) => {
            if (!isChanged) setIsChanged(true);
          }}
        >
          <Form.Item
            name="primary_class_id"
            label={
              <Space>
                班级
                <Tooltip title="选择班级后，可代表班级参加 IJIA 学院的考试，并可以生成班级头像大合照">
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
      </Spin>
    </div>
  );
}

function BindAccountList(props: { profileResult: UseAsyncResult<UserProfileDto>; onProfileChange?(): void }) {
  const { profileResult, onProfileChange } = props;
  const profile = profileResult.value;
  const accounts = profile?.bind_accounts ?? [];

  const { refresh: onAccountChange, value: user } = useCurrentUser();
  const { api } = useHoFetch();
  const { run: onRemoveBind, result: removeBindResult } = useAsync(async (item: BindAccountDto) => {
    await api["/user/bind_platform"].delete({ body: { bindKey: item.key } });
    message.success("已解除");
    onAccountChange();
    onProfileChange?.();
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
      <Spin spinning={profileResult.loading}>
        <div className="bind-list">
          <Avatar.Group>
            {accounts?.map((account) => {
              const key = account.key;
              return (
                <Popover
                  key={key}
                  content={
                    <div>
                      <Meta
                        icon={<Avatar src={account.avatar_url}>{account.user_name}</Avatar>}
                        title={account.user_name}
                      ></Meta>
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
                  <Avatar key={key} src={account.avatar_url}>
                    {account.user_name}
                  </Avatar>
                </Popover>
              );
            })}
          </Avatar.Group>
          <Button icon={<PlusOutlined />} onClick={() => setIsAddBind(true)}>
            添加绑定
          </Button>
        </div>
      </Spin>
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
            onAccountChange();
            onProfileChange?.();
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
      placeholder="选择班级"
    />
  );
}
type ThirdPartAccountBind = BindAccountDto & {
  platformIcon?: string;
};
