import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { LoginForm, ProFormText } from "@ant-design/pro-components";
import { Alert, Space, Tabs } from "antd";
import { useContext } from "react";
import { useState } from "react";
import { Link } from "react-router";
import { LoginType, UserLoginParamDto } from "@/api.ts";
import { CAN_HASH_PASSWORD, tryHashPassword } from "../util/pwd_hash.ts";
import { AndContext } from "@/hooks/antd.ts";
import { IjiaLogo } from "@/common/site-logo.tsx";
import styled from "@emotion/styled";
import { useAsync } from "@/hooks/async.ts";
import { ImageCaptchaModal } from "@/common/capthca/ImageCaptcha.tsx";
import classNames from "classnames";
import { useWindowResize } from "@/hooks/window.ts";
import { VideoBg } from "../components/VideoBg.tsx";
import { IGNORE_ERROR_MSG, useHoFetch } from "@/hooks/http.ts";
import { useRedirect } from "@/hooks/redirect.ts";
import { getPathByRouter } from "@/common/navigation.ts";
import { useCurrentUser } from "@/common/user.ts";

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
export function LoginPage() {
  const go = useRedirect({ defaultPath: () => getPathByRouter("/live") });
  const [loginType, setLoginType] = useState<LoginType>(LoginType.id);
  const [message, setMessage] = useState<Msg | undefined>(defaultMessage);
  const { api } = useHoFetch();
  const [loginParam, setLoginParam] = useState<UserLoginParamDto | undefined>();
  const [captchaModalOpen, setCaptchaModalOpen] = useState(false);
  const { result: value, run: postLogin } = useAsync(async function (param: UserLoginParamDto) {
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
  const loginLoading = value.loading;

  const windowSize = useWindowResize();

  const { modal } = useContext(AndContext);
  const onClickLoinBtn = async (param: IdLoginParam) => {
    setMessage(defaultMessage);

    try {
      const loginParam = await getLoinParam(loginType, param);
      setLoginParam(loginParam);
    } catch (error) {
      throw error;
    }
    setCaptchaModalOpen(true);
  };

  return (
    <StyledPage>
      <VideoBg />
      <div className={classNames("main", { center: windowSize.height * 1.2 > windowSize.width })}>
        <div className="left-desc"> </div>

        <div className="login-form-container">
          <LoginForm
            logo={
              <Link to="/" title="首页">
                <IjiaLogo size={44} />
              </Link>
            }
            message={message && <Alert type={message.type} message={message.title} />}
            title="IJIA 学院"
            subTitle="IJIA 学院"
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
                        rules={[{ required: true }]}
                      />
                    </>
                  ),
                },
              ]}
              centered
              activeKey={loginType}
              onChange={(activeKey) => setLoginType(activeKey as LoginType)}
            />

            <div className="login-operation">
              {/* <ProFormCheckbox noStyle name="saveUser">
                记住账号
              </ProFormCheckbox> */}
              <Space>
                <Link to="../find-account" style={{ float: "right" }}>
                  忘记密码
                </Link>
                <Link to="../signup" style={{ float: "right" }}>
                  注册账号
                </Link>
              </Space>
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
  position: relative;

  .main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    position: relative;
    .left-desc {
      color: #fff;
      font-size: 48px;
      font-weight: bold;
    }
    .login-form-container {
      width: 400px;
      padding: 0 24px;
      > * {
        box-shadow: 0 0 2px #9b9b9b;
      }
      .login-operation {
        margin-block-end: 24px;
        display: flex;
        justify-content: space-between;
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
`;

type EmailLoginParam = {
  email: string;
  password: string;
};
type IdLoginParam = {
  id: string;
  password: string;
};
async function getLoinParam(loginType: LoginType, param: IdLoginParam) {
  let loginParam: UserLoginParamDto | undefined;
  const id = param.id;

  if (/^\d+$/.test(id)) {
    loginParam = {
      method: LoginType.id,
      id: (param as IdLoginParam).id,
      ...(await tryHashPassword(param.password)),
    };
  } else {
    loginParam = {
      method: LoginType.email,
      email: id,
      ...(await tryHashPassword(param.password)),
    };
  }

  return loginParam;
}
