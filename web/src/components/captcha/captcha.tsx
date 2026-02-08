import { Result } from "antd";
import { useMemo } from "react";
import { CheckCircleTwoTone } from "@ant-design/icons";
import { useThemeToken } from "@/provider/mod.tsx";
import { css, cx } from "@emotion/css";

export type CaptchaPanelProps = {
  title?: string;
  imageList: string[];
  value?: number[];
  onChange: (selected: number[]) => void;
  errorMessage?: string;
  isError?: boolean;
};
export function CaptchaPanel(props: CaptchaPanelProps) {
  const { onChange, imageList, value, errorMessage, isError, title } = props;
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
    <div>
      <h4>{title}</h4>
      {isError ? (
        <Result status="error" title={errorMessage} style={{ minHeight: 316 }} />
      ) : (
        <div className={WrapperCSS}>
          {imageList.map((src, index) => {
            const checked = selected.has(index);
            return (
              <div key={src + index} className={cx(CaptchaItem, { checked })}>
                <img className="captcha-img" src={src} onClick={() => onCheck(index)} />
                {checked ? (
                  <CheckCircleTwoTone className="checked-icon" twoToneColor={theme.colorSuccess} />
                ) : undefined}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
const WrapperCSS = css`
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(3, 100px);
  grid-gap: 8px;
`;

const CaptchaItem = css`
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
  &.checked {
    transition: all 500ms;
    background-color: #000;
    .captcha-img {
      opacity: 0.7;
    }
  }
`;
