type GenOption = {
  title: string;
  code: string;
  /** 有效时间，单位秒 */
  time: number;
  appName: string;
};
export function createEmailCodeHtmlContent(option: GenOption) {
  const { code, time, title } = option;
  const mit = Math.floor(time / 60);
  return ` <!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${option.appName}验证码</title>
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        background-color: #e6e6e6;
      }
      .header {
        color: #fff;
        background-color: rgb(49, 93, 170);
        padding: 18px;
      }
      .header .title {
        font-size: 42px;
      }
      .main {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .hello {
        line-height: 3;
      }
      .code {
        font-size: 48px;
        background-color: rgb(36, 70, 77);
        padding: 24px;
        border-radius: 6px;
        color: #fff;
      }
      .tip {
        color: rgb(36, 70, 77);
        line-height: 4;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <b class="title">IJIA 学院</b>
      <div class="hello">${title}</div>
    </div>
    <div class="main">
      <b class="tip">你的验证码为：</b>
      <b class="code">${code}</b>
      <b class="tip">验证码为在 ${mit} 分钟内有效</b>
    </div>
  </body>
</html>`;
}
