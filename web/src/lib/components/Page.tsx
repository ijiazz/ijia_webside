import { IS_MOBILE_LAYOUT } from "@/provider/mod.tsx";
import { css, cx } from "@emotion/css";

export const PagePadding = css`
  padding: 24px;
  @media screen and (${IS_MOBILE_LAYOUT}) {
    padding: 14px;
  }
`;
