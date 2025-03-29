import { Avatar } from "antd";
import { useCurrentUser, UserProfileBasic } from "./user.ts";
import styled from "@emotion/styled";
import { useThemeToken } from "@/hooks/antd.ts";
import React from "react";
export type StudentIdCardInfo = {
  avatarUrl?: string;
  id?: string;
  name?: string;
  className?: string;
  isOfficial?: boolean;
};

const WIDTH_HEIGHT = 85.6 / 53.98;
export function StudentIdCard(props: StudentIdCardInfo & { loading?: boolean }) {
  const studentInfo = props;
  const token = useThemeToken();
  const HEIGHT = 220;
  const WIDTH = HEIGHT * WIDTH_HEIGHT;

  return (
    <StudentIdCardCSS style={{ height: HEIGHT, width: WIDTH, backgroundColor: token.colorBgBase }}>
      <div className="student-card-header">{studentInfo.isOfficial ? "IJIA 学院" : "未认证"}</div>
      <div className="student-card-body">
        <div className="student-card-content">
          <Avatar size={80} src={props.avatarUrl}>
            {props.name}
          </Avatar>
          <div className="student-card-info-core">
            <div className="student-card-name">{studentInfo.name ?? "--"}</div>
            <div className="student-card-id">学号：{studentInfo.id ?? "--"}</div>
            <div className="student-card-class">班级：{studentInfo.className ?? "--"}</div>
          </div>
        </div>
      </div>
    </StudentIdCardCSS>
  );
}
const StudentIdCardCSS = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  border-radius: 8px;
  padding: 16px;
  margin: 8px;
  .student-card {
    &-header {
      font-size: 4.5mm;
      font-weight: bold;
      line-height: 2;
    }
    &-body {
      width: 100%;
      margin-top: 14px;
    }
    &-content {
      width: 100%;
      display: flex;
      align-items: center;
      .ant-avatar {
        margin: 8px;
      }
      .student-card-info-core {
        margin: 8px 12px;

        .student-card-name {
          font-weight: bold;
          font-size: 5mm;
          line-height: 2;
        }
        .student-card-id {
          line-height: 2;
        }
      }
    }
  }
`;
export function CurrentIdCard() {
  const { loading, value } = useCurrentUser();
  const info: UserProfileBasic | Record<string, undefined> = value ?? {};
  return (
    <StudentIdCard
      {...value}
      loading={loading}
      className={info.primary_class?.class_name}
      avatarUrl={info.avatar_url}
      id={info.userIdStr}
      name={info.nickname}
      isOfficial={info.is_official}
    />
  );
}
