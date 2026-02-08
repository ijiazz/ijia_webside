import { ReactNode } from "react";
import coverSrc from "../-img/cover.webp";
import { css } from "@emotion/css";

export function DocsBoard(props: { children: ReactNode }) {
  return (
    <div className={CoverBoardCSS}>
      <div className="cover">
        <img src={coverSrc} />
      </div>
      <main>{props.children}</main>
    </div>
  );
}
const CoverBoardCSS = css`
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
