import React, { ReactNode } from "react";
import styled from "@emotion/styled";

export type UserCard3DProps = {
  avatar?: ReactNode;
  title?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};
export function UserCard3D(props: UserCard3DProps) {
  const { avatar, title, footer: more, children } = props;
  return (
    <StyledWrapper id="platforms">
      <div className="card">
        <div className="content-box">
          <span className="card-title">{title}</span>
          <p className="card-content">{children}</p>
          <span className="see-more">{more}</span>
        </div>
        <div className="date-box">{avatar}</div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  width: 300px;
  padding: 20px;
  perspective: 1000px;

  .card {
    padding-top: 50px;
    /* border-radius: 10px; */
    border: 3px solid rgb(255, 255, 255);
    transform-style: preserve-3d;
    background:
      linear-gradient(135deg, #0000 18.75%, #f3f3f3 0 31.25%, #0000 0),
      repeating-linear-gradient(45deg, #f3f3f3 -6.25% 6.25%, #ffffff 0 18.75%);
    background-size: 60px 60px;

    background-position:
      0 0,
      0 0;
    background-color: #f0f0f0;
    width: 100%;
    box-shadow: rgba(142, 142, 142, 0.3) 0px 30px 30px -10px;
    transition: all 0.5s ease-in-out;
  }

  .card:hover {
    background-position:
      -100px 100px,
      -100px 100px;
    transform: rotate3d(0.5, 1, 0, 30deg);
  }

  .content-box {
    background: rgba(4, 193, 250, 0.732);
    /* border-radius: 10px 100px 10px 10px; */
    transition: all 0.5s ease-in-out;
    padding: 60px 25px 25px 25px;
    transform-style: preserve-3d;
  }

  .content-box .card-title {
    display: inline-block;
    color: white;
    font-size: 25px;
    font-weight: 900;
    transition: all 0.5s ease-in-out;
    transform: translate3d(0px, 0px, 50px);
  }

  .content-box .card-title:hover {
    transform: translate3d(0px, 0px, 60px);
  }

  .content-box .card-content {
    margin-top: 10px;
    font-size: 12px;
    font-weight: 700;
    color: #f2f2f2;
    transition: all 0.5s ease-in-out;
    transform: translate3d(0px, 0px, 30px);
  }

  .content-box .card-content:hover {
    transform: translate3d(0px, 0px, 60px);
  }

  .content-box .see-more {
    cursor: pointer;
    margin-top: 1rem;
    display: inline-block;
    text-transform: uppercase;
    color: white;
    /* border-radius: 5px; */
    padding: 0.5rem 0.7rem;
    transition: all 0.5s ease-in-out;
    transform: translate3d(0px, 0px, 20px);
  }

  .content-box .see-more:hover {
    transform: translate3d(0px, 0px, 60px);
  }

  .date-box {
    position: absolute;
    top: 30px;
    right: 30px;
    height: 60px;
    width: 60px;
    background: white;
    border: 2px solid #fff;
    border-radius: 50%;
    overflow: hidden;
    transform: translate3d(0px, 0px, 80px);
    box-shadow: rgba(100, 100, 111, 0.2) 0px 17px 10px -10px;
  }

  .date-box span {
    display: block;
    text-align: center;
  }
`;
