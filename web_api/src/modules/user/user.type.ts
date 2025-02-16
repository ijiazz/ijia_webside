export type CreateUserProfileDto = {
  email: string;
  password?: string;
  /** 班级 id */
  classId?: string[];
};
export type CreateUserProfileResult = {
  userId: number;
};
export type UserProfileDto = {};

export type UserLoginResultDto = {
  success: boolean;
  message?: string;
  redirect?: string;
  tip?: {
    title: string;
    content: string;
  };
};
export type UserLoginByIdParam = {
  method: "id";
  id: string;
};

export type UserLoginByEmailParam = {
  method: "email";
  email: string;
};
export type UserLoginParamDto = (UserLoginByIdParam | UserLoginByEmailParam) & {
  password: string;
  passwordNoHash: boolean;
};
