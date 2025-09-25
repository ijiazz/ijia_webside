import React, { ReactNode } from "react";
import coverSrc from "../-img/cover.webp";
import styled from "@emotion/styled";

export function DocsBoard(props: { children: ReactNode }) {
  return (
    <CoverBoardCSS>
      <div className="cover">
        <img src={coverSrc} />
      </div>
      <main>{props.children}</main>
    </CoverBoardCSS>
  );
}
const CoverBoardCSS = styled.div`
  max-width: 800px;
  margin: 0 auto;
  main {
    position: relative;
    top: -150px;
    background-color: #fff;
    border-radius: 28px;
    padding: 24px 38px;
  }
  .cover {
    background: linear-gradient(#000 50%, #fff);
    img {
      mix-blend-mode: screen;
      object-fit: cover;
      width: 100%;
      min-height: 400px;
    }
  }
`;
