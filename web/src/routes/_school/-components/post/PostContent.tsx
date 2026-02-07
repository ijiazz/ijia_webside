import { AssetImage, AssetMediaDto, AssetVideo, TextStructure } from "@/api.ts";
import { useThemeToken } from "@/provider/mod.tsx";
import styled from "@emotion/styled";
import { CSSProperties, useMemo } from "react";
import { ReactNode } from "react";
import { MediaType } from "@/api.ts";
import { FileImageOutlined } from "@ant-design/icons";
import { TextStruct } from "@/components/TextStructure.tsx";

export type PostContentProps = {
  text: string | null;
  textStruct: TextStructure[] | null;
  media: (AssetMediaDto | undefined)[];
};
export function PostContent(props: PostContentProps) {
  const total = props.media?.length ?? 0;
  const theme = useThemeToken();
  const mediaList = useMemo(() => {
    if (!props.media) return [];
    let list = props.media;
    if (list.length >= 9) list = list.slice(0, 9);
    return list;
  }, [props.media]);
  return (
    <PostContentCSS>
      <TextStruct
        text={props.text}
        structure={props.textStruct}
        className="post-content-text"
        style={{ marginBottom: 12 }}
      />
      {mediaList.length > 1 ? (
        <PostMediaMultipleCSS>
          {mediaList.map((item, index) => {
            if (!item) return <InvalidAsset />;

            let element: ReactNode;
            switch (item.type) {
              case MediaType.image: {
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
              case MediaType.video: {
                element = (
                  <PostVideo key={index} item={item.origin} cover={item.cover?.url} className="post-media-item" />
                );
                break;
              }
              default:
                break;
            }
            return index === 8 && total > 9 ? (
              <div className="post-multiple-omit">
                {element}
                <div style={{ color: theme.colorBorderSecondary }}>+{total - 9}</div>
              </div>
            ) : (
              element
            );
          })}
        </PostMediaMultipleCSS>
      ) : mediaList.length ? (
        <div className="post-single">{getSingleMedia(mediaList[0])}</div>
      ) : undefined}
    </PostContentCSS>
  );
}
function getSingleMedia(item?: AssetMediaDto) {
  if (!item) return <InvalidAsset />;
  switch (item.type) {
    case MediaType.video: {
      return <PostVideo item={item.origin} cover={item.cover?.url} className="post-media-item" />;
    }
    case MediaType.image: {
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
