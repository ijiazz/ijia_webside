import styled from "@emotion/styled";
import React from "react";

export function MaskBoard(props: { children?: React.ReactNode }) {
  const { children } = props;
  return <MaskBoardCSS>{children}</MaskBoardCSS>;
}
const MaskBoardCSS = styled.div`
  margin: 12px;
  max-width: 600px;
  border-radius: 6px;
  box-shadow: 0 0 2px #d7d7d7;
  padding: 24px;

  background-color: #fff8;
  backdrop-filter: blur(6px);
`;
