import { Result } from "antd";
import { useMemo } from "react";
import styled from "@emotion/styled";
import { CheckCircleTwoTone } from "@ant-design/icons";
import classnames from "classnames";
import { useThemeToken } from "@/hooks/antd.ts";

export type CaptchaPanelProps = {
  imageList: string[];
  value?: number[];
  onChange: (selected: number[]) => void;
  errorMessage?: string;
  isError?: boolean;
};
export function CaptchaPanel(props: CaptchaPanelProps) {
  const { onChange, imageList, value, errorMessage, isError } = props;
  const theme = useThemeToken();
  const selected = useMemo(() => new Set(value ?? []), [value]);
  const onCheck = (index: number) => {
    if (selected.has(index)) {
      selected.delete(index);
    } else {
      selected.add(index);
    }
    onChange(Array.from(selected));
  };
  return (
    <StyledCaptchaPanel>
      {isError ? (
        <Result status="error" title={errorMessage} style={{ minHeight: 316 }} />
      ) : (
        <div className="grid">
          {imageList.map((src, index) => {
            const checked = selected.has(index);
            return (
              <div key={src + index} className={classnames("captcha-item", { checked })}>
                <img className="captcha-img" src={src} onClick={() => onCheck(index)} />
                {checked ? (
                  <CheckCircleTwoTone className="checked-icon" twoToneColor={theme.colorSuccess} />
                ) : undefined}
              </div>
            );
          })}
        </div>
      )}
    </StyledCaptchaPanel>
  );
}
const StyledCaptchaPanel = styled.div`
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 100px);
    grid-template-rows: repeat(3, 100px);
    grid-gap: 8px;

    .captcha-item {
      position: relative;
      border: 1px solid #d6d6d6;
      .checked-icon {
        position: absolute;
        font-size: large;
        left: calc(50% - 7px);
        top: calc(50% - 7px);
      }
      .captcha-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        font: 14px;
        cursor: pointer;
      }
    }
    .captcha-item.checked {
      background-color: #000;
      .captcha-img {
        opacity: 0.7;
      }
    }
  }
`;
