import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { LoginForm, ProFormCheckbox, ProFormText } from "@ant-design/pro-components";
import { Alert, Space, Tabs } from "antd";
import React from "react";
import { useState } from "react";
import { LoginType, PassportConfig, UserLoginParamDto } from "@/api.ts";
import { CAN_HASH_PASSWORD, tryHashPassword } from "../../../routes/passport/-util/pwd_hash.ts";
import { useAntdStatic } from "@/global-provider.tsx";
import { IjiaLogo } from "@/common/site-logo.tsx";
import styled from "@emotion/styled";
import { useAsync } from "@/hooks/async.ts";
import { ImageCaptchaModal } from "@/common/capthca/ImageCaptcha.tsx";
import classNames from "classnames";
import { useWindowResize } from "@/hooks/window.ts";
import { useRedirect } from "@/hooks/redirect.ts";
import { getPathByRoute } from "@/app.ts";
import { useCurrentUser } from "@/common/user.ts";
import { api, IGNORE_ERROR_MSG } from "@/common/http.ts";
import { Route as ParentRoute } from "./route.tsx";

export const Route = createLazyFileRoute("/passport/_video_background/login")({
  component: RouteComponent,
});

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
export function RouteComponent() {
  const config: PassportConfig = ParentRoute.useLoaderData() ?? {};

  const go = useRedirect({ defaultPath: () => getPathByRoute("/live") });
  const [loginType, setLoginType] = useState<LoginType>(LoginType.id);
  const [message, setMessage] = useState<Msg | undefined>(defaultMessage);
  const [loginParam, setLoginParam] = useState<UserLoginParamDto | undefined>();
  const [captchaModalOpen, setCaptchaModalOpen] = useState(false);
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
  const { refresh } = useCurrentUser({ manual: true });

  const windowSize = useWindowResize();

  const { modal } = useAntdStatic();
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
  const isCenter = windowSize ? windowSize.height * 1.2 > windowSize.width : false;
  return (
    <StyledPage>
      <div className={classNames("main", { center: isCenter })}>
        <div className="left-desc"> </div>

        <div className="login-form-container">
          <LoginForm
            logo={
              <Link to="/" title="首页" viewTransition>
                <IjiaLogo size={44} />
              </Link>
            }
            message={message && <Alert type={message.type} message={message.title} />}
            title="IJIA 学院"
            subTitle="要一直在哦！"
            onFinish={onClickLoinBtn}
            loading={loginLoading}
          >
            <Tabs
              items={[
                {
                  key: LoginType.id,
                  label: "学号登陆",
                  children: (
                    <>
                      <ProFormText
                        name="id"
                        fieldProps={{ prefix: <UserOutlined /> }}
                        placeholder="学号或邮箱"
                        rules={[
                          {
                            required: true,
                            pattern: /^((\d+)|([^@]+@.+?\..+))$/,
                            message: "请输入正确的学号或邮箱",
                          },
                        ]}
                      />
                      <ProFormText.Password
                        name="password"
                        fieldProps={{ prefix: <LockOutlined /> }}
                        placeholder="密码"
                      />
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
              <ProFormCheckbox
                name="agreement"
                rules={[
                  {
                    async validator(rule, value, callback) {
                      if (!value) throw new Error("请先关注佳佳子_zZ");
                    },
                  },
                ]}
              >
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
              </ProFormCheckbox>
            </div>
          </LoginForm>
          <ImageCaptchaModal
            open={captchaModalOpen}
            onSubmit={(sessionId: string, selectedIndex: number[]) => {
              setCaptchaModalOpen(false);
              postLogin({ ...loginParam!, captcha: { sessionId, selectedIndex } });
            }}
            onCancel={() => setCaptchaModalOpen(false)}
          />
        </div>
      </div>
    </StyledPage>
  );
}
const StyledPage = styled.div`
  height: 100%;

  .main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    .left-desc {
      color: #fff;
      font-size: 48px;
      font-weight: bold;
    }
    .login-form-container {
      max-width: 400px;

      .ant-checkbox-label {
        color: #fff;
      }

      > * {
        box-shadow: 0 0 2px #9b9b9b;
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .login-operation {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        a {
          color: #fff;
          text-shadow: #707070 0px 0px 2px;
        }
      }
    }
    .ant-pro-form-login-container {
      background-color: #fff8;
      backdrop-filter: blur(6px);
      border-radius: 4px;
    }
  }
  .main.center {
    justify-content: center;
    .left-desc {
      display: none;
    }
  }
  @media (min-width: 448px) {
    .login-form-container {
      padding: 0 24px;
    }
  }
`;

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
