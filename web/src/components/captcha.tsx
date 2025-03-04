import { Button } from "antd";
import { useMemo, useState } from "react";
import styled from "@emotion/styled";

export type CaptchaPanelProps = {
  imageList: string[];
  confirmLoading?: boolean;
  onChange: (selected: number[]) => void;
  loading?: boolean;
};
export function CaptchaPanel(props: CaptchaPanelProps) {
  const { onChange, loading, imageList, confirmLoading } = props;

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const onCheck = (index: number) => {
    if (selected.has(index)) {
      selected.delete(index);
    } else {
      selected.add(index);
    }
    setSelected(new Set(selected));
  };
  return (
    <div>
      <StyledDiv>
        {imageList.map((src, index) => {
          const checked = selected.has(index);
          return (
            <div className={checked ? "checked" : undefined}>
              <img key={src + index} src={src} onClick={() => onCheck(index)} />
              {checked ? <div></div> : undefined}
            </div>
          );
        })}
      </StyledDiv>
      <Button loading={confirmLoading} onClick={() => onChange(Array.from(selected))}>
        确定
      </Button>
    </div>
  );
}
const StyledDiv = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 100px);
`;
