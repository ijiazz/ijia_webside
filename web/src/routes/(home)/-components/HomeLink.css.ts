import { css } from "@emotion/css";
export const LinkItem = css`
  font-weight: 500;
  font-size: 14px;
`;

export const HomeLink = css`
  padding: 8px 12px;
  display: flex;
  > * {
    padding-left: 4%;
    padding-right: 4%;
  }
  @media screen and (max-width: 550px) {
    > * {
      padding-left: 4px;
      padding-right: 4px;
    }
  }
  @media screen and (max-width: 400px) {
    > * {
      padding-left: 2px;
      padding-right: 2px;
    }
  }
`;
export const HomeLinks = css`
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: center;
  pointer-events: all;
  a {
    text-decoration: none;
    cursor: pointer;
  }

  .home-link-left {
  }
  .home-link-right {
    flex: 1;
    justify-content: flex-end;
  }
`;
export const Dropdown = css`
  .ant-dropdown-menu {
    background-color: #0003;
    padding: 0;
    .ant-dropdown-menu-item {
      :hover {
        background-color: #000f;
      }
    }
  }
  .ant-dropdown-menu-title-content {
    color: #fff;
  }
`;

export const Hover = css`
  .cta {
    border: none;
    background: none;
    cursor: pointer;
  }

  .cta span {
    padding-bottom: 7px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--color);
    text-shadow: 0 0 10px #fff;
  }

  .hover-underline-animation {
    position: relative;
    padding-bottom: 20px;
  }

  .hover-underline-animation:after {
    content: "";
    position: absolute;
    width: 100%;
    transform: scaleX(0);
    height: 2px;
    bottom: 0;
    left: 0;
    background-color: var(--color);
    transform-origin: bottom right;
    transition: transform 0.25s ease-out;
  }

  .cta:hover .hover-underline-animation:after {
    transform: scaleX(1);
    transform-origin: bottom left;
  }
`;
