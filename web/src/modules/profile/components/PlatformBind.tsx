import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { Avatar, Button, Input, Divider } from "antd";
import { Platform, ThirdPartSelect } from "@/common/third_part_account.tsx";
import { ReactNode, useContext, useState } from "react";
import { useThemeToken, AndContext } from "@/hooks/antd.ts";
import styled from "@emotion/styled";
import { BindPlatformCheckDto } from "@/api.ts";

export function PlatformBind(props: { onBindSuccess?(): void }) {
  const { onBindSuccess } = props;
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
      <div className="input">
        <ThirdPartSelect disabled value={platform} onChange={setPlatform}></ThirdPartSelect>
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.currentTarget.value)}
          allowClear
          style={{ width: 400 }}
        ></Input>
        <Button
          disabled={!inputText}
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

function Meta(props: { icon: ReactNode; title?: ReactNode; description?: ReactNode }) {
  const { icon, description, title } = props;
  const token = useThemeToken();
  return (
    <MetaCSS>
      {icon}
      <div className="text">
        <div className="title" style={{ fontWeight: token.fontWeightStrong, flexShrink: 0 }}>
          {title}
        </div>
        <div className="description" style={{ color: token.colorTextDescription }}>
          {description}
        </div>
      </div>
    </MetaCSS>
  );
}
const MetaCSS = styled.div`
  margin: 8px 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  .text {
    .title {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .description {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      -webkit-line-clamp: 2;
    }
  }
`;
