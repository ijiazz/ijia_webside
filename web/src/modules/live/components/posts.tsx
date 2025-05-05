import { AssetImage, AssetMediaDto, AssetVideo, TextStructure } from "@/api.ts";
import { useThemeToken } from "@/hooks/antd.ts";
import styled from "@emotion/styled";
import React, { CSSProperties, useMemo } from "react";
import { PropsWithChildren, ReactNode } from "react";
import { AssetItemDto, AssetMediaType } from "@/api.ts";
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
      {props.children}
    </UserMetaCSS>
  );
}
const UserMetaCSS = styled.div`
  overflow: hidden;
  margin: 8px 12px;

  display: grid;
  gap: 8px;
  align-items: center;
  place-items: stretch;
  grid-template-columns: 40px auto;
  > div:last-of-type {
    grid-column-start: span 2;
  }
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
  > span {
    color: ${(props) => props.color};
  }
  margin-bottom: 12px;
`;
export function PostContent(props: { item: AssetItemDto }) {
  const { item } = props;
  const total = item.media?.length ?? 0;
  const theme = useThemeToken();
  const mediaList = useMemo(() => {
    if (!item.media) return [];
    let list = item.media;
    if (list.length >= 9) list = list.slice(0, 9);
    return list;
  }, [item.media]);
  return (
    <PostContentCSS>
      <PostText text={item.content_text} structure={item.content_text_structure} />
      {mediaList.length > 1 ? (
        <PostMediaMultipleCSS>
          {mediaList.map((item, index) => {
            if (!item) return <InvalidAsset />;

            let element: ReactNode;
            switch (item.type) {
              case AssetMediaType.image: {
                const image = item.cover ?? item.origin;
                element = (
                  <PostImage
                    style={{ width: "100%", height: "100%" }}
                    key={index}
                    item={image}
                    className="post-media-item"
                  />
                );
                break;
              }
              case AssetMediaType.video: {
                element = (
                  <PostVideo key={index} item={item.origin} cover={item.cover?.url} className="post-media-item" />
                );
                break;
              }
              default:
                break;
            }
            return index === 8 ? (
              <div className="post-multiple-omit">
                {element}
                <div style={{ color: theme.colorBorderSecondary }}>+{total - 9}</div>
              </div>
            ) : (
              element
            );
          })}
        </PostMediaMultipleCSS>
      ) : (
        <div className="post-single">{getSingleMedia(mediaList[0])}</div>
      )}
    </PostContentCSS>
  );
}
function getSingleMedia(item?: AssetMediaDto) {
  if (!item) return <InvalidAsset />;
  switch (item.type) {
    case AssetMediaType.video: {
      return <PostVideo item={item.origin} cover={item.cover?.url} className="post-media-item" />;
    }
    case AssetMediaType.image: {
      const image = item.cover ?? item.origin;
      return <PostImage style={{ width: "100%", height: "100%" }} className="post-media-item" item={image} />;
    }
    default:
      break;
  }
}
const PostMediaMultipleCSS = styled.div`
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
  .post-multiple-omit {
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
`;
const PostContentCSS = styled.div`
  max-height: 100vh;

  overflow: hidden;
  .post-single {
    overflow: hidden;
    .post-media-item {
      max-width: 100%;
      max-height: 80vh;
      object-fit: cover;
    }
  }
`;
function InvalidAsset() {
  return <FileImageOutlined style={{ fontSize: 32, margin: 12 }} />;
}
function PostVideo(props: { item: AssetVideo; cover?: string; className?: string }) {
  const { item, cover } = props;
  return <video className={props.className} controls loop key={item.url} src={item.url} poster={cover}></video>;
}
function PostImage(props: { item: AssetImage; style?: CSSProperties; className?: string }) {
  const { item, style } = props;

  return <img className={props.className} src={item.url} style={style}></img>;
}
