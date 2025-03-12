import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { Avatar, Button, Input, Divider, Popover, Typography, Tag } from "antd";
import { Platform } from "@/common/third_part_account.tsx";
import { useContext, useState } from "react";
import { useThemeToken, AndContext } from "@/hooks/antd.ts";
import styled from "@emotion/styled";
import { BindPlatformCheckDto } from "@/api.ts";
// import step1Path from "@asset/profile/douyin-step-1.jpg";
import step2Path from "@asset/profile/douyin-step-2.jpg";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Meta } from "@/lib/components/Meta.tsx";

export function PlatformBind(props: { userId?: number | string; onBindSuccess?(): void }) {
  const { onBindSuccess, userId } = props;
  const { api } = useHoFetch();
  const { message } = useContext(AndContext);
  const { result, run } = useAsync(function (platform: Platform, url: string) {
    return api["/user/bind_platform/check"].post({
      body: { platformList: [{ platform, userHomeLink: url }] },
    });
  });
  const { run: onBind, result: bindResult } = useAsync(async function (account: {
    platform: Platform;
    pla_uid: string;
  }) {
    await api["/user/bind_platform"].post({ body: { platformList: [account] } });
    message.success("绑定成功");
  });
  const [platform, setPlatform] = useState<Platform>(Platform.douYin);
  const [inputText, setInputText] = useState<string>();
  const checkResult: BindPlatformCheckDto | undefined = result.value;
  return (
    <PlatformBindCSS>
      <div className="tip">
        {/* <ThirdPartSelect disabled value={platform} onChange={setPlatform}></ThirdPartSelect> */}
        {userId !== undefined && (
          <div>
            为了证明抖音账号是你的，请将 <Tag bordered={false} color="blue">{`IJIA学号：<${userId}>`}</Tag>
            插入简介的任意位置，在绑定成功后，可以自行删除。 需要注意的是，<b>一个抖音账号只能绑定一个学号</b>。
            检测通过后，<b>IJIA学院将保存该账号在抖音的头像、昵称和简介，用于该学号在IJIA学院网站的展示</b>
          </div>
        )}
      </div>
      <div className="input">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.currentTarget.value)}
          allowClear
          style={{ width: 400 }}
          placeholder="输入抖音个人首页连接"
        ></Input>
        <Button
          disabled={!inputText || userId === undefined}
          onClick={() => {
            const url = inputText!.match(/https?:\/\/.+/)?.[0];
            if (url) {
              setInputText(url.trim());
              run(platform, url.trim()).then(onBindSuccess);
            }
          }}
          loading={result.loading}
        >
          检测
        </Button>
        <Popover title="如何获取个人分享链接" content={<TutorialModal />} trigger="hover">
          <QuestionCircleOutlined />
        </Popover>
      </div>
      {checkResult && (
        <BindCheckResult
          {...checkResult}
          bindLoading={bindResult.loading}
          onBind={() => onBind({ pla_uid: checkResult.platformUser.pla_uid, platform: platform })}
        ></BindCheckResult>
      )}
    </PlatformBindCSS>
  );
}
const PlatformBindCSS = styled.div`
  max-width: 600px;
  margin: 8px 0;
  > .tip {
    margin-bottom: 8px;
  }
  > .input {
    display: flex;
    gap: 8px;
    .ant-select {
      flex: 1;
    }
  }
`;

function BindCheckResult(props: BindPlatformCheckDto & { onBind?: () => void; bindLoading?: boolean }) {
  const { onBind, platformUser, bind, bindLoading } = props;
  const token = useThemeToken();
  return (
    <BindCheckResultCSS style={{ backgroundColor: token.colorBgBase }}>
      <Meta
        icon={<Avatar size="large" src={platformUser.avatarPath} />}
        title={platformUser.username}
        description={platformUser.description}
      />
      <Divider />
      {bind && (
        <div style={{ color: token.colorError }}>
          该账号已被学号为 <span className="student-id">{bind.user_id}</span> 的用户绑定，如果再次绑定，学号为{" "}
          <span className="student-id">{bind.user_id}</span> 的用户将会与之解除绑定关系
        </div>
      )}
      <div className="footer">
        <Button type="primary" onClick={onBind} loading={bindLoading}>
          绑定
        </Button>
      </div>
    </BindCheckResultCSS>
  );
}
const BindCheckResultCSS = styled.div`
  margin: 12px 0;
  padding: 8px;
  border-radius: 6px;
  .student-id {
    font-weight: bold;
    margin-bottom: 8px;
  }

  .footer {
    display: flex;
    justify-content: center;
  }
`;

const { Paragraph, Title } = Typography;

function TutorialModal() {
  //TODO: 绑定教程
  return (
    <TutorialModalCSS>
      <Paragraph>
        <Title level={5}>从抖音APP获取首页连接</Title>
        <Paragraph>
          1. 在抖音APP个人页，点击抖音号旁边的小二维码(一定要点中)
          {/* <img src={step1Path} /> */}
          2. 点击右上角小箭头，点击弹出的菜单左下角的”复制链接“，然后粘贴到输入框中
          <img src={step2Path} />
        </Paragraph>
      </Paragraph>
    </TutorialModalCSS>
  );
}
const TutorialModalCSS = styled.div`
  max-width: 500px;
  max-height: 400px;
  overflow-y: auto;
  img {
    margin: 8px auto;
    max-width: 300px;
    display: block;
  }
`;
