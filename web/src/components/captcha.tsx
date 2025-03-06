import { Button, Spin, Image, Space } from "antd";
import { useMemo, useState } from "react";
import styled from "@emotion/styled";

export type CaptchaPanelProps = {
  imageList: string[];
  value?: number[];
  onChange: (selected: number[]) => void;
};
export function CaptchaPanel(props: CaptchaPanelProps) {
  const { onChange, imageList, value } = props;
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
      <div className="grid">
        {imageList.map((src, index) => {
          const checked = selected.has(index);
          return (
            <div key={src + index} className={checked ? "checked" : undefined}>
              <img className="captcha-img" src={src} onClick={() => onCheck(index)} />
              {checked ? <div></div> : undefined}
            </div>
          );
        })}
      </div>
    </StyledCaptchaPanel>
  );
}
const StyledCaptchaPanel = styled.div`
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 100px);
    grid-template-rows: repeat(3, 100px);
    grid-gap: 8px;
    .captcha-img {
      width: 100%;
      height: 100%;
      object-fit: cover;

      .checked {
        opacity: 0.5;
      }
    }
  }
`;
