import { IS_MOBILE_LAYOUT } from "@/provider/mod.tsx";
import { css } from "@emotion/css";

export const Root = css`
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  > .root-layout-body {
    flex: 1;
    overflow: auto;
  }

  @media screen and (${IS_MOBILE_LAYOUT}) {
    flex-direction: column-reverse;
  }
`;

export const NavTab = css`
  backdrop-filter: blur(8px);
  border-block-end: 1px solid var(--border-color);

  @media screen and (${IS_MOBILE_LAYOUT}) {
    border-block-end: 0 !important;
    border-block-start: 1px solid var(--border-color);

    .ant-tabs-tab {
      padding: 14 px 0 !important;
    }
  }

  .ant-tabs-nav {
    margin: 0;

    .ant-tabs-nav-wrap {
      .ant-tabs-tab {
        margin: 0 16px;
        padding: 16px 0;
      }
      /* .ant-tabs-tab {
          border-radius: 3px;
          margin: 0;
          padding: 16px;
          :hover {
            background: rgba(0, 0, 0, 0.03);
            color: inherit;
          }
        } */
      .ant-tabs-tab.ant-tabs-tab-active {
      }
      .ant-tabs-ink-bar.ant-tabs-ink-bar-animated {
      }

      margin-left: 12px;
      .ant-tabs-tab:first-of-type {
        margin-left: 4px;
      }
    }
  }
`;
