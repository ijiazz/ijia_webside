import { PlusOutlined } from "@ant-design/icons";
import { Avatar, Button, message, Modal, Popover, Space, Spin, Typography } from "antd";
import { useState } from "react";
import { PlatformBind } from "../PlatformBind.tsx";
import styled from "@emotion/styled";
import { Meta } from "@/lib/components/Meta.tsx";
import { BindAccountDto, UserInfoDto } from "@/api.ts";
import { api } from "@/common/http.ts";
import { useMutation } from "@tanstack/react-query";

export function BindAccountList(props: {
  profileData: UserInfoDto;
  profileLoading?: boolean;
  onProfileChange?(): void;
}) {
  const { profileData: profile, profileLoading, onProfileChange } = props;
  const accounts = profile.bind_accounts ?? [];

  const { mutateAsync: onRemoveBind, isPending: removeBindLoading } = useMutation({
    mutationFn: async (item: BindAccountDto) => {
      await api["/user/bind_platform"].delete({ body: { bindKey: item.key } });
    },
    onSuccess() {
      message.success("已解除");
      onProfileChange?.();
    },
  });
  const { mutateAsync: refreshAccount, isPending: refreshAccountLoading } = useMutation({
    mutationFn: async (item: BindAccountDto) => {
      await api["/user/profile/sync"].post({ body: { bindKey: item.key } });
    },
    onSuccess() {
      message.success("已更新");
      onProfileChange?.();
    },
  });

  const [confirmOpen, setConfirmOpen] = useState<{ title: string; item: BindAccountDto } | undefined>();
  const [isAddBind, setIsAddBind] = useState(false);
  return (
    <BindAccountListCSS>
      <Typography.Title level={5}>账号绑定</Typography.Title>
      <Spin spinning={profileLoading}>
        <div className="bind-list">
          <Avatar.Group>
            {accounts.map((account) => {
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
          userId={profile.user_id}
          onBindSuccess={() => {
            setIsAddBind(false);
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
