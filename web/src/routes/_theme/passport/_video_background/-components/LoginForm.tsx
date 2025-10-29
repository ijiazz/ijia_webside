import { Link } from "@tanstack/react-router";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Checkbox, Form, Input, Space, Tabs } from "antd";
import React from "react";
import { useState } from "react";
import { LoginType, PassportConfig, UserLoginParamDto } from "@/api.ts";
import { CAN_HASH_PASSWORD, tryHashPassword } from "@/common/pwd_hash.ts";
import { useAntdStatic, useThemeToken } from "@/provider/mod.tsx";
import { IjiaLogo } from "@/common/site-logo.tsx";
import styled from "@emotion/styled";
import { useAsync } from "@/hooks/async.ts";
import { ImageCaptchaModal } from "@/common/capthca/ImageCaptcha.tsx";
import { useRedirect } from "@/hooks/redirect.ts";
import { getPathByRoute } from "@/app.ts";
import { useCurrentUser } from "@/common/user.ts";
import { api, IGNORE_ERROR_MSG } from "@/common/http.ts";
import { Route as ParentRoute } from "../route.tsx";

type Msg = {
  type?: "info" | "success" | "error" | "warning";
  title: string;
};
const defaultMessage: Msg | undefined = CAN_HASH_PASSWORD
  ? undefined
  : {
      type: "warning",
      title: "当前环境无法对密码进行加密，你的密码将以明文发送到服务器！",
    };

export function LoginForm() {
  const config: PassportConfig = ParentRoute.useLoaderData() ?? {};
  const [loginType, setLoginType] = useState<LoginType>(LoginType.id);
  const [message, setMessage] = useState<Msg | undefined>(defaultMessage);
  const [loginParam, setLoginParam] = useState<UserLoginParamDto | undefined>();

  const go = useRedirect({ defaultPath: () => getPathByRoute("/live") });
  const [captchaModalOpen, setCaptchaModalOpen] = useState(false);
  const { modal } = useAntdStatic();
  const { refresh } = useCurrentUser({ manual: true });
  const { loading: loginLoading, run: postLogin } = useAsync(async function (param: UserLoginParamDto) {
    const result = await api["/passport/login"].post({ body: param, allowFailed: true, [IGNORE_ERROR_MSG]: true });

    if (!result.success) {
      setMessage({ title: result.message ?? "登录失败", type: "error" });
    }

    if (result.tip) {
      await new Promise<void>((resolve, reject) => {
        modal.info({
          title: result.tip?.title,
          content: result.tip?.content,
          onCancel: () => reject(),
          onOk: resolve,
        });
      });
    }
    if (result.success) {
      refresh();
      go();
    }
  });
  const onClickLoinBtn = async (param: IdLoginParam) => {
    setMessage(defaultMessage);

    try {
      const loginParam = await getLoinParam(loginType, param);
      if (config.loginCaptchaDisabled) {
        return postLogin(loginParam);
      }
      setLoginParam(loginParam);
    } catch (error) {
      throw error;
    }
    setCaptchaModalOpen(true);
  };
  const theme = useThemeToken();
  return (
    <LoginFormCSS>
      <div className="logo">
        <Link to="/" title="首页" viewTransition>
          <IjiaLogo size={44} />
        </Link>
        IJIA 学院
      </div>
      <span style={{ color: theme.colorTextDescription, fontSize: theme.fontSize }}>要一直在哦！</span>
      <div className="message">{message && <Alert type={message.type} message={message.title} />}</div>
      <Form onFinish={onClickLoinBtn}>
        <Tabs
          items={[
            {
              key: LoginType.id,
              label: "学号登陆",
              children: (
                <>
                  <Form.Item
                    name="id"
                    rules={[
                      {
                        required: true,
                        pattern: /^((\d+)|([^@]+@.+?\..+))$/,
                        message: "请输入正确的学号或邮箱",
                      },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="学号或邮箱" />
                  </Form.Item>
                  <Form.Item name="password">
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                </>
              ),
            },
          ]}
          centered
          activeKey={loginType}
          onChange={(activeKey) => setLoginType(activeKey as LoginType)}
        />
        <div className="actions">
          <div className="login-operation">
            {/* <ProFormCheckbox noStyle name="saveUser">
                记住账号
              </ProFormCheckbox> */}
            <Space>
              <Link to="../find-account" style={{ float: "right" }} viewTransition>
                忘记密码
              </Link>
              <Link to="../signup" style={{ float: "right" }} viewTransition>
                注册账号
              </Link>
            </Space>
          </div>
          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                async validator(rule, value, callback) {
                  if (!value) throw new Error("请先关注佳佳子_zZ");
                },
              },
            ]}
          >
            <Checkbox>
              我已在抖音关注&nbsp;
              <b>
                <a
                  target="_blank"
                  href="https://www.douyin.com/user/MS4wLjABAAAA0AiK9Q4FlkTxKHo-b6Vi1ckA2Ybq-WNgJ-b5xXlULtI"
                  style={{ color: "#003674" }}
                >
                  佳佳子_zZ
                </a>
              </b>
            </Checkbox>
          </Form.Item>
        </div>
        <Button htmlType="submit" type="primary" size="large" loading={loginLoading}>
          登录
        </Button>
      </Form>
      <ImageCaptchaModal
        open={captchaModalOpen}
        onSubmit={(sessionId: string, selectedIndex: number[]) => {
          setCaptchaModalOpen(false);
          postLogin({ ...loginParam!, captcha: { sessionId, selectedIndex } });
        }}
        onCancel={() => setCaptchaModalOpen(false)}
      />
    </LoginFormCSS>
  );
}
type EmailLoginParam = {
  email: string;
  password?: string;
};
type IdLoginParam = {
  id: string;
  password?: string;
};
async function getLoinParam(loginType: LoginType, param: IdLoginParam) {
  let loginParam: UserLoginParamDto | undefined;
  const id = param.id;

  if (/^\d+$/.test(id)) {
    loginParam = {
      method: LoginType.id,
      id: (param as IdLoginParam).id,
    };
  } else {
    loginParam = {
      method: LoginType.email,
      email: id,
    };
  }
  if (param.password) {
    const p = await tryHashPassword(param.password);
    Object.assign(loginParam, p);
  }
  return loginParam;
}
const LoginFormCSS = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 28px;

  background-color: #fff8;
  box-shadow: 0 0 2px #9b9b9b;
  backdrop-filter: blur(6px);
  border-radius: 4px;
  .logo {
    display: flex;
    align-items: center;
    gap: 1em;
    font-size: 32px;
    font-weight: bold;
  }
  .message {
    margin-top: 8px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 320px;
    max-width: 100%;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .login-operation {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      a {
        color: #fff;
        text-shadow: #707070 0px 0px 2px;
      }
    }
    .ant-checkbox-label {
      color: #fff;
    }
  }
`;
