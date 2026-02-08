import { css, cx } from "@emotion/css";
import React from "react";

export function MaskBoard(props: { children?: React.ReactNode }) {
  const { children } = props;
  return <div className={MaskBoardCSS}>{children}</div>;
}
const MaskBoardCSS = css`
  margin: 12px;
  max-width: 600px;
  border-radius: 6px;
  box-shadow: 0 0 2px #d7d7d7;
  padding: 24px;

  background-color: #fff8;
  backdrop-filter: blur(6px);
`;
