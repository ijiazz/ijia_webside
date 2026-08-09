import { BugOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { Button, Divider, Input, Popover, Typography } from "antd";
import { css } from "@emotion/css";
import { useContext, useState } from "react";
import { useAntdStatic } from "@/provider/mod.tsx";
import { BasicUserContext } from "../-context/UserContext.tsx";

export function IJIADevFloatMenu() {
  const [open, setOpen] = useState(false);

  const user = useContext(BasicUserContext);
  return (
    <Popover
      content={<IJIADevFloatMenuContent />}
      title="IJIA Dev"
      trigger="click"
      placement="bottomLeft"
      open={open}
      onOpenChange={setOpen}
    >
      <Button shape="round" icon={<BugOutlined />}>
        {user ? <Typography.Text type="secondary">{`UID：${user.user_id}`}</Typography.Text> : "当前没有用户会话"}
      </Button>
    </Popover>
  );
}
type IJIADevFloatMenuContentProps = {};

function IJIADevFloatMenuContent(props: IJIADevFloatMenuContentProps) {
  const [user, setUser] = useState<string>("");
  const { message } = useAntdStatic();
  const { mutate, isPending } = useMutation({
    mutationFn: devLogin,
    onSuccess: async (_, loginEmail) => {
      message.success("登录成功，正在刷新页面");
      globalThis.location.reload();
    },
    onError: (error) => {
      message.error("登录失败");
    },
  });

  const onSubmit = () => {
    const nextEmail = user.trim();
    if (!nextEmail) {
      message.warning("请输入邮箱");
      return;
    }
    mutate(nextEmail);
  };

  return (
    <div className={PanelCSS}>
      <Divider style={{ margin: "10px 0" }} />
      <Typography.Text strong>快捷登录</Typography.Text>
      <Input
        value={user}
        placeholder="输入邮箱或学号"
        onChange={(event) => setUser(event.currentTarget.value)}
        onPressEnter={onSubmit}
      />
      <Button type="primary" block loading={isPending} disabled={!user.trim()} onClick={onSubmit}>
        登录并刷新
      </Button>
    </div>
  );
}

const PanelCSS = css`
  width: min(320px, calc(100vw - 48px));
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

async function devLogin(user: string) {
  let input: { id: string } | { email: string };
  if (/^\d+$/.test(user)) {
    input = { id: user };
  } else {
    input = { email: user };
  }
  const response = await fetch("/api/test/passport/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorData?.message ?? "登录失败");
  }

  return response.json().catch(() => null);
}
