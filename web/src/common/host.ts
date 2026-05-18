export const RECORD_SITE = "https://record.ijiazz.cn";
export const ACCOUNT_CENTER_URL = `https://account.ijiazz.cn`;

const FILE_ORIGIN = globalThis.location.origin;

export function getFileURL(uri: string) {
  return new URL("/file/" + uri, FILE_ORIGIN).href;
}

export const getLoginURL = (redirect?: string) => {
  const url = new URL(ACCOUNT_CENTER_URL + "/login");
  if (redirect) url.searchParams.set("redirect", redirect);
  return url.toString();
};

export const SECURITY_SETTING_URL = `${ACCOUNT_CENTER_URL}/security`;
