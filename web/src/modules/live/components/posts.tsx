import { TextStructure } from "@/api.ts";
import { useThemeToken } from "@/hooks/antd.ts";
import styled from "@emotion/styled";
import React, { CSSProperties, useMemo } from "react";
import { PropsWithChildren, ReactNode } from "react";
import { AssetItemDto, ImageInfoDto, MediaLevel, VideoAssetDto } from "@/api.ts";
import { FileImageOutlined } from "@ant-design/icons";

export type PostCardProps = {
  icon?: ReactNode;
  header?: ReactNode;
  style?: React.CSSProperties;
};
export function PostCardLayout(props: PropsWithChildren<PostCardProps>) {
  return (
    <UserMetaCSS>
      {props.icon}
      {props.header}
      <div></div>
      {props.children}
    </UserMetaCSS>
  );
}
const UserMetaCSS = styled.div`
  overflow: hidden;
  margin: 8px 12px;
  display: grid;
  grid-template-columns: 40px auto;
  gap: 8px;
  align-items: center;
  .text {
  }
`;
function PostText(props: { text?: string | null; structure?: TextStructure[] | null }) {
  const { structure, text } = props;
  const theme = useThemeToken();
  const split = useMemo(() => {
    if (!structure?.length || !text) return text;
    const list: ReactNode[] = [];
    let offset = 0;
    for (let i = 0; i < structure.length; i++) {
      const item = structure[i];
      if (item.index > offset) {
        list.push(text.slice(offset, item.index));
      }
      offset = item.index + item.length;
      const xText = text.slice(item.index, offset);
      list.push(<span key={i + xText}>{xText}</span>);
    }
    if (offset < text.length) list.push(text.slice(offset));
    return list;
  }, [structure, text]);

  return <PostTextCSS color={theme.colorWarning}>{split}</PostTextCSS>;
}

const PostTextCSS = styled.div`
  font-weight: 350;
  > span {
    color: ${(props) => props.color};
  }
  margin-bottom: 12px;
`;
export function PostContent(props: { item: AssetItemDto }) {
  const { item } = props;
  const total = item.imageList?.length ?? 0;
  const theme = useThemeToken();
  const imageList = useMemo(() => {
    if (!item.imageList) return [];
    let list = item.imageList;
    if (list.length >= 9) list = list.slice(0, 9);
    return list.map((item) => {
      return item?.formats[MediaLevel.thumb] ?? item?.origin;
    });
  }, [item.imageList]);
  return (
    <PostContentCSS>
      <PostText text={item.content_text} structure={item.content_text_structure} />
      <div className="post-video">
        {item.videoList?.map((item, index) => {
          if (!item) return <InvalidAsset key={index} />;
          return <PostVideo key={index} item={item} />;
        })}
      </div>
      <div className="post-image">
        {imageList?.map((item, index) => {
          if (!item) return <InvalidAsset key={index} />;
          const element = <PostImage style={{ width: "100%", height: "100%" }} key={index} item={item} />;
          if (index === 8) {
            return (
              <div className="post-image-omit">
                {element}
                <div style={{ color: theme.colorBorderSecondary }}>+{total}</div>
              </div>
            );
          }
          return element;
        })}
      </div>
    </PostContentCSS>
  );
}

const PostContentCSS = styled.div`
  max-height: 100vh;

  overflow: hidden;
  .post-video {
    overflow: hidden;
    .post-media-item {
      max-width: 100%;
      max-height: 100vh;
      object-fit: cover;
    }
  }
  .post-image {
    overflow: auto;
    max-width: 100%;
    display: grid;
    grid-gap: 8px;
    grid-template-columns: repeat(3, 100px);
    grid-auto-rows: 100px;

    place-items: stretch;
    place-content: stretch;

    .post-media-item {
      display: block;
      object-fit: cover;
      border-radius: 6px;
    }
    .post-image-omit {
      position: relative;
      *:last-of-type {
        position: absolute;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24px;
        background-color: #0005;
        font-weight: bold;
      }
    }
  }
`;
function InvalidAsset() {
  return <FileImageOutlined style={{ fontSize: 32, margin: 12 }} />;
}
function PostVideo(props: { item: VideoAssetDto }) {
  const { item } = props;
  if (item.cover?.url) return <img className="post-media-item" src={item.cover?.url}></img>;
  return <video className="post-media-item" controls loop key={item.origin.url} src={item.origin.url}></video>;
}
function PostImage(props: { item: ImageInfoDto; style?: CSSProperties }) {
  const { item, style } = props;

  return <img className="post-media-item" src={item.url} style={style}></img>;
}
