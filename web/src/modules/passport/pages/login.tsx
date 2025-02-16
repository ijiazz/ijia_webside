import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { LoginForm, ProFormCheckbox, ProFormText } from "@ant-design/pro-components";
import { Alert, Space, Tabs } from "antd";
import { useContext } from "react";
import { useState } from "react";
import { Link } from "react-router";
import { useAsyncFn } from "react-use";
import { api } from "@/common/http.ts";
import { UserLoginParamDto } from "@/api.ts";
import { tryHashPassword } from "../util/pwd_hash.ts";
import { antdStatic } from "@/hooks/antd-static.ts";
import { IjiaLogo } from "@/components/ijia-logo.tsx";

enum LoginType {
  id = "id",
  email = "email",
}
export function LoginPage() {
  const [loginType, setLoginType] = useState<LoginType>(LoginType.id);
  const [message, setMessage] = useState<string | undefined>();
  const { modal } = useContext(antdStatic);

  const [loginState, postLogin] = useAsyncFn(async function (param: UserLoginParamDto) {
    const result = await api["/user/login"].post({ body: param });
    if (result.message) setMessage(result.message);

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
    if (result.redirect) {
      location.replace(result.redirect);
      return;
    }
    return result;
  }, []);
  async function onLogin(param: EmailLoginParam | IdLoginParam) {
    let loginParam: UserLoginParamDto | undefined;

    switch (loginType) {
      case LoginType.id: {
        loginParam = {
          method: LoginType.id,
          id: (param as IdLoginParam).id,
          ...(await tryHashPassword(param.password)),
        };
        break;
      }
      case LoginType.email: {
        loginParam = {
          method: LoginType.email,
          email: (param as EmailLoginParam).email,
          ...(await tryHashPassword(param.password)),
        };
      }
      default:
        throw new Error("登录方法不支持：" + loginType);
    }
    if (loginParam.passwordNoHash) {
      await new Promise<void>((resolve, reject) => {
        modal.warning({
          title: "当前环境无法对密码进行加密，你的密码将以明文发送到服务器！是否继续登录？",
          onCancel: reject,
          onOk: resolve,
        });
      });
    }

    await postLogin(loginParam);
  }
  return (
    <div style={{ height: "100%", position: "relative" }}>
      <VideoBg />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "100%",
          position: "relative",
        }}
      >
        <div> {/* //TODO: 文案 */}</div>

        <div style={{ width: "400px", padding: "0 24px" }}>
          <LoginForm
            logo={
              <Link to="/" title="首页">
                <IjiaLogo size={44} />
              </Link>
            }
            message={message && <Alert type="error" message={message} />}
            title="IJIA 学院"
            subTitle="IJIA 学院"
            onAuxClick={() => console.log("d")}
            onFinish={onLogin}
            containerStyle={{
              backgroundColor: "#fff8",
              borderRadius: "4px",
              backdropFilter: "blur(6px)",
            }}
            loading={loginState.loading}
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
                        fieldProps={{ prefix: <UserOutlined className={"prefixIcon"} /> }}
                        placeholder={"学号"}
                        rules={[{ required: true }]}
                      />
                      <ProFormText.Password
                        name="password"
                        fieldProps={{ prefix: <LockOutlined className={"prefixIcon"} /> }}
                        placeholder={"密码"}
                        rules={[{ required: true }]}
                      />
                    </>
                  ),
                },
                {
                  key: LoginType.email,
                  label: "邮箱登陆",
                  children: (
                    <>
                      <ProFormText
                        name="email"
                        fieldProps={{ prefix: <UserOutlined className={"prefixIcon"} /> }}
                        placeholder={"邮箱"}
                        rules={[{ required: true }]}
                      />
                      <ProFormText.Password
                        name="password"
                        fieldProps={{ prefix: <LockOutlined className={"prefixIcon"} /> }}
                        placeholder={"密码"}
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

            <div
              style={{
                marginBlockEnd: 24,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              {/* <ProFormCheckbox noStyle name="saveUser">
                记住账号
              </ProFormCheckbox> */}
              <Space>
                <Link to="../find-account" style={{ float: "right" }}>
                  忘记密码
                </Link>
                <Link to="../signin" style={{ float: "right" }}>
                  注册账号
                </Link>
              </Space>
            </div>
          </LoginForm>
        </div>
      </div>
    </div>
  );
}
function VideoBg() {
  return (
    <div
      style={{
        position: "absolute",
        height: "100%",
        top: 0,
        left: 0,
        overflow: "hidden",
        zIndex: -1,
      }}
    >
      <video
        style={{
          height: "100%",
          width: "100vw",
          objectFit: "cover",
        }}
        muted
        autoPlay
        loop
      >
        <source src="/main/bg-login.mp4" type="video/mp4" />
        {/* <img
      src="/main/bg-login.jpg"
      style={{
        height: "100%",
        width: "100%",
        objectFit: "cover",
      }}
    /> */}
      </video>
    </div>
  );
}
type EmailLoginParam = {
  email: string;
  password: string;
};
type IdLoginParam = {
  id: string;
  password: string;
};
