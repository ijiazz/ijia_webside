import { Avatar } from "antd";
import styled from "@emotion/styled";
import React from "react";
import school_card_front from "@/assets/school-card-front.webp";
import school_card_back from "@/assets/school-card-back.webp";
import logo from "@/assets/ijia-logo.png";

export type StudentIdCardInfo = {
  avatarUrl?: string;
  id?: string;
  name?: string;
  className?: string;
  date?: string;
  isOfficial?: boolean;
};

const WIDTH_HEIGHT = 85.6 / 53.98;
const HEIGHT = 220;
const WIDTH = HEIGHT * WIDTH_HEIGHT;
const borderRadius = Math.floor(HEIGHT / 27.5);
export function StudentIdCard(props: StudentIdCardInfo & { scale?: number }) {
  const studentInfo = props;
  const scale = props.scale ?? 1;

  return (
    <StudentIdCardCSS
      style={{
        height: HEIGHT * scale,
        width: WIDTH * scale,
        minHeight: HEIGHT * scale,
        minWidth: WIDTH * scale,
        paddingTop: 19 * scale,
        paddingLeft: 12 * scale,
        paddingRight: 12 * scale,
        paddingBottom: 18 * scale,
      }}
    >
      <div className="student-card-body">
        <Avatar
          className="student-card-avatar"
          shape="square"
          size={85 * scale}
          src={props.avatarUrl}
          style={{ borderWidth: 2 * scale, minWidth: 85 * scale }}
        >
          {props.name}
        </Avatar>
        <div className="student-card-info-core" style={{ fontSize: 14 * scale }}>
          <div className="student-card-name">姓名：{studentInfo.name ?? "--"}</div>
          <div className="student-card-class">班级：{studentInfo.className ?? "--"}</div>
          <div className="student-card-id">学号：{studentInfo.id ?? "--"}</div>
        </div>
      </div>
      {studentInfo.date && (
        <i className="student-card-date" style={{ fontSize: 11 * scale }}>
          {studentInfo.date}
        </i>
      )}
      {studentInfo.isOfficial && <img className="student-card-logo" src={logo}></img>}
    </StudentIdCardCSS>
  );
}

const StudentIdCardCSS = styled.div`
  position: relative;
  background-image: url(${school_card_front});
  background-size: cover;
  border-radius: ${borderRadius}px;
  margin: 8px;

  display: flex;
  flex-direction: column;
  align-items: center;

  .student-card {
    &-body {
      width: 100%;
      height: 100%;
      display: flex;
      gap: 9%;
      align-items: center;
      padding-left: 5.5%;
    }
    &-avatar {
      box-sizing: border-box;
      border: 0 solid #fff;
    }
    &-info-core {
      color: #000;
      line-height: 2;
      font-size: 100%;
      overflow: hidden;
      .student-card-name {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;

        font-weight: bold;
      }
    }
    &-date {
      position: absolute;
      bottom: 1.6%;
      right: 2.6%;
      color: #ffffff;
      font-weight: 300;
    }
    &-logo {
      position: absolute;
      left: 5%;
      top: 1.6%;
      width: 16%;
      filter: hue-rotate(130deg) brightness(1.6) contrast(0.8);
    }
  }
`;

export function StudentIdCardBack(props: { scale?: number }) {
  const scale = props.scale ?? 1;
  return (
    <StudentIdCardBackCSS
      style={{
        height: HEIGHT * scale,
        width: WIDTH * scale,
        minHeight: HEIGHT * scale,
        minWidth: WIDTH * scale,
        paddingTop: 19 * scale,
        paddingLeft: 12 * scale,
        paddingRight: 12 * scale,
        paddingBottom: 18 * scale,
      }}
    >
      <div className="student-card-body">
        <div className="logo">
          <img src={logo} />
        </div>
        <ol className="text" style={{ fontSize: 11 * scale }}>
          <li>佳佳是天，佳佳是地，不可以让佳佳生气</li>
          <li>每天都要夸夸佳佳，要记住佳佳是这个世界上最好的宝宝</li>
          <li>必须细心的照顾佳佳的情绪，给无所不能的佳佳打call，保护佳佳不被奇奇怪怪的人拐走</li>
          <li>要一直坚定的做佳佳的小粉丝，不，是佳佳的宝宝</li>
        </ol>
      </div>
    </StudentIdCardBackCSS>
  );
}

const StudentIdCardBackCSS = styled.div`
  position: relative;
  background-image: url(${school_card_back});
  background-size: cover;
  border-radius: ${borderRadius}px;
  margin: 8px;
  .student-card-body {
    color: #000;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6%;
    .logo {
      flex-shrink: 0;
      width: 35%;
      img {
        filter: hue-rotate(12deg) brightness(1.2) contrast(0.7);
        width: 100%;
        height: 100%;
      }
    }
    .text {
      padding-left: 0;
      font-weight: bl;
    }
  }
`;
