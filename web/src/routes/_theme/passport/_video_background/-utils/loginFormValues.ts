import { LoginMethod, UserIdentifierType, UserLoginParam, UserLoginByPasswordParam, UserLoginResult } from "@/api.ts";
import { tryHashPassword } from "@/common/pwd_hash.ts";
import { clearUserCache } from "@/common/user.ts";
import { useAntdStatic } from "@/provider/AntdProvider.tsx";
import { api, IGNORE_ERROR_MSG } from "@/request/client.ts";
import { useMutation } from "@tanstack/react-query";

export type EmailLoginFormValues = {
  keepLoggedIn: boolean;
  email: { email: string; sessionId: string };
  emailCaptcha: string;
};
export type PasswordLoginFormValues = {
  user: string;
  password?: string;
  keepLoggedIn: boolean;
  captcha: UserLoginByPasswordParam["captcha"];
};
export type LoginFormValues = EmailLoginFormValues | PasswordLoginFormValues;

export async function getPasswordLoginParam(param: PasswordLoginFormValues): Promise<UserLoginParam> {
  let loginParam: UserLoginParam | undefined;
  const user = param.user;

  if (/^\d+$/.test(user)) {
    loginParam = {
      method: LoginMethod.password,
      captcha: param.captcha,
      keepLoggedIn: param.keepLoggedIn,
      user: {
        type: UserIdentifierType.userId,
        userId: parseInt(user),
      },
    };
  } else {
    loginParam = {
      method: LoginMethod.password,
      captcha: param.captcha,
      keepLoggedIn: param.keepLoggedIn,
      user: {
        type: UserIdentifierType.email,
        email: user,
      },
    };
  }

  if (param.password) {
    const p = await tryHashPassword(param.password);
    Object.assign(loginParam, p);
  }
  return loginParam;
}

export type UserLoginOption = {
  onField: (result: UserLoginResult) => void;
  onSuccess: () => void;
};
export function useLogin(options: UserLoginOption) {
  const { onField, onSuccess } = options;
  const { modal } = useAntdStatic();
  const { isPending: loginLoading, mutateAsync } = useMutation({
    mutationFn: async (param: UserLoginParam) => {
      const result = await api["/passport/login"].post({ body: param, allowFailed: true, [IGNORE_ERROR_MSG]: true });
      return result;
    },
    async onSuccess(result) {
      if (!result.success) {
        onField(result);
      } else {
        clearUserCache();
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
        onSuccess();
      }
    },
  });

  return {
    handleLogin: mutateAsync,
    loginLoading,
  };
}
