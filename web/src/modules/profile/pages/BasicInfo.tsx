import { StudentIdCard, StudentIdCardBack } from "@/common/StudentIdCard.tsx";
import { useAsync } from "@/hooks/async.ts";
import { PlusOutlined, QuestionCircleOutlined, ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Checkbox,
  DatePicker,
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
import { BindAccountDto, UserInfoDto } from "@/api.ts";
import { api, toFileUrl } from "@/common/http.ts";
import dayjs, { Dayjs } from "dayjs";
import { PagePadding } from "@/lib/components/Page.tsx";
import { useThemeToken } from "@/global-provider.tsx";

export function BasicInfoPage() {
  const { data, loading, run } = useAsync(
    () => {
      return api["/user/profile"].get().then((res) => ({
        ...res,
        bind_accounts: res.bind_accounts.map((item) => ({ ...item, avatar_url: toFileUrl(item.avatar_url) })),
      }));
    },
    { autoRunArgs: [] },
  );
  const [zoom, setZoom] = useState(1);

  const date = useMemo(() => {
    const time = data?.profile?.acquaintance_time;
    if (!time) return undefined;
    const date = new Date(time);

    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  }, [data]);

  return (
    <PagePadding>
      <Button
        icon={zoom === 1 ? <ZoomInOutlined /> : <ZoomOutOutlined />}
        onClick={() => setZoom((size) => (size === 1 ? 2 : 1))}
      >
        {zoom === 1 ? "放大" : "缩小"}
      </Button>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        <StudentIdCard
          className={data?.primary_class?.class_name}
          avatarUrl={data?.avatar_url}
          id={data?.user_id.toString().padStart(5)}
          name={data?.nickname}
          isOfficial={data?.is_official}
          scale={zoom}
          date={date}
        />
        <StudentIdCardBack scale={zoom} />
      </div>
      <BindAccountList profileData={data} profileLoading={loading} onProfileChange={() => run()} />
      <BasicForm profileData={data} profileLoading={loading} onProfileChange={() => run()} />
    </PagePadding>
  );
}

type BasicFormData = {
  received_live?: boolean;
  primary_class_id?: number | null;
  acquaintance_time?: Dayjs | null;
  /** 是否开启年度评论统计 */
  comment_stat_enabled?: boolean;
};
function BasicForm(props: { profileData?: UserInfoDto; profileLoading?: boolean; onProfileChange?(): void }) {
  const { profileData: profile, profileLoading, onProfileChange } = props;

  const { refresh: afterUpdate } = useCurrentUser();
  const [form] = Form.useForm<BasicFormData>();
  const [isChanged, setIsChanged] = useState(false);

  const defaultData = useMemo(() => {
    let defaultData: BasicFormData = {};
    if (profile) {
      const pf = profile.profile ?? { acquaintance_time: null, comment_stat_enabled: false, live_notice: false };
      defaultData = {
        received_live: pf.live_notice ?? false,
        primary_class_id: profile.primary_class?.class_id ?? null,
        acquaintance_time: pf.acquaintance_time && dayjs(pf.acquaintance_time),
        comment_stat_enabled: pf.comment_stat_enabled,
      };
    }
    return defaultData;
  }, [profile]);
  useEffect(() => {
    form.setFieldsValue(defaultData);
  }, [defaultData]);

  const { run: onUpdate } = useAsync(async function () {
    const formData = await form.validateFields();
    await api["/user/profile"].patch({
      body: {
        notice_setting: {
          live: formData.received_live,
        },
        acquaintance_time: formData.acquaintance_time?.toISOString() ?? null,
        comment_stat_enabled: formData.comment_stat_enabled,
        primary_class_id: formData.primary_class_id ?? null,
      },
    });
    message.success("已修改");
    setIsChanged(false);
    onProfileChange?.();
    afterUpdate?.();
  });

  const theme = useThemeToken();

  return (
    <div>
      <Spin spinning={profileLoading}>
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
        {profile?.is_official || (
          <div style={{ color: theme.colorWarningText, margin: "0 0 14px 0" }}>部分信息需要绑定平台账号后才能修改</div>
        )}
        <Form
          form={form}
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
            <PublicClassSelect disabled={!profile?.is_official} />
          </Form.Item>
          <Form.Item
            name="acquaintance_time"
            label={
              <Space>
                纪念日
                <Tooltip title="将根据这个日期为你推送纪念日邮件和个性化壁纸">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <DatePicker />
          </Form.Item>
          <Form.Item label={null} name="received_live" valuePropName="checked">
            <Checkbox>
              <Space>
                接收直播通知
                <Tooltip title="佳佳直播时，将通过邮件发送通知。你可能需要将 school@ijiazz.cn 添加到白名单">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            </Checkbox>
          </Form.Item>
          <Form.Item label={null} name="comment_stat_enabled" valuePropName="checked">
            <Checkbox disabled={!profile?.is_official}>
              <Space>
                年度评论统计
                <Tooltip title="如果勾选，将在年度(12月份)统计时统计(抽样)你在佳佳作品的评论数，然后生成头像排名">
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

function BindAccountList(props: { profileData?: UserInfoDto; profileLoading?: boolean; onProfileChange?(): void }) {
  const { profileData: profile, profileLoading, onProfileChange } = props;
  const accounts = profile?.bind_accounts ?? [];

  const { refresh: onAccountChange, value: user } = useCurrentUser();
  const { run: onRemoveBind, loading: removeBindLoading } = useAsync(async (item: BindAccountDto) => {
    await api["/user/bind_platform"].delete({ body: { bindKey: item.key } });
    message.success("已解除");
    onAccountChange();
    onProfileChange?.();
  });
  const { run: refreshAccount, loading: refreshAccountLoading } = useAsync(async (item: BindAccountDto) => {
    await api["/user/profile/sync"].post({ body: { bindKey: item.key } });
    message.success("已更新");
    onAccountChange();
    onProfileChange?.();
  });
  const [confirmOpen, setConfirmOpen] = useState<{ title: string; item: BindAccountDto } | undefined>();
  const [isAddBind, setIsAddBind] = useState(false);
  return (
    <BindAccountListCSS>
      <Typography.Title level={5}>账号绑定</Typography.Title>
      <Spin spinning={profileLoading}>
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
                        <Button size="small" loading={refreshAccountLoading} onClick={() => refreshAccount(account)}>
                          同步用户信息
                        </Button>
                        <Button
                          loading={removeBindLoading}
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
        okButtonProps={{ loading: removeBindLoading }}
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

function PublicClassSelect(props: { value?: number; onChange?(value: number): void; disabled?: boolean }) {
  const token = useThemeToken();
  const { data } = useAsync(
    async function (search?: string) {
      const { items } = await api["/class/public"].get();
      return items.map((item) => ({
        ...item,
        label: (
          <Space>
            <span>{item.class_name}</span>
            {item.description ? (
              <span style={{ fontSize: token.fontSizeSM, color: token.colorTextDescription }}>{item.description}</span>
            ) : undefined}
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
      options={data}
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
