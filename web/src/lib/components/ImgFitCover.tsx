import styled from "@emotion/styled";
import classNames from "classnames";
import React, { CSSProperties } from "react";
import { ReactNode } from "react";

export function ImageFitCover(props: {
  src?: string;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const { src, className, ...rest } = props;
  return (
    <ImageFitCoverCSS>
      <img className="bg-cover" src={props.src} />
      <div className={classNames("bg-cover-content", className)} {...rest}>
        {props.children}
      </div>
    </ImageFitCoverCSS>
  );
}

const ImageFitCoverCSS = styled.div`
  margin-bottom: 8px;
  position: relative;
  .bg-cover {
    width: 100%;
    object-fit: cover;
  }
  .bg-cover-content {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
  }
`;
