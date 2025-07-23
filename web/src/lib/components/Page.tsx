import { IS_MOBILE_LAYOUT } from "@/global-provider.tsx";
import styled from "@emotion/styled";

export const PagePadding = styled.div`
  padding: 24px;
  @media screen and (${IS_MOBILE_LAYOUT}) {
    padding: 14px;
  }
`;
