type GenOption = {
  message: string;
  code: string;
  /** 有效时间，单位秒 */
  time: number;
  appName: string;
};
export function createEmailCodeHtmlContent(option: GenOption) {
  const { code, time, message, appName } = option;
  const mit = Math.floor(time / 60);
  return ` <!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}验证码</title>
  </head>
  <body style="margin:0; padding:0; background-color: #e6e6e6">
    <div style="color: #fff; background-color: rgb(49, 93, 170); padding: 18px;">
      <b style="font-size: 42px">${appName}</b>
      <div style="line-height: 3">${message}</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center;">
      <b style="color: rgb(36, 70, 77);  line-height: 4;">你的验证码为：</b>
      <b style="font-size: 48px; background-color: rgb(36, 70, 77); padding: 24px; border-radius: 6px; color: #fff;">${code}</b>
      <b style="color: rgb(36, 70, 77); line-height: 4">验证码为在 ${mit} 分钟内有效</b>
    </div>
  </body>
</html>`;
}
