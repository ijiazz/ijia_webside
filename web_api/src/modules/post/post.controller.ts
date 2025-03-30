import { Controller, Get, ToArguments, Use } from "@asla/hono-decorator";
import { groupByIndex, selectAssetList, toFormats, audioToDto, imageToDto, videoToDto } from "./sql/post.ts";
import { AssetItemDto, GetPostListParam, LivePostResponse, PostAssetType } from "./post.dto.ts";
import { autoBody } from "@/global/pipe.ts";
import { enumPlatform, MediaLevel, Platform } from "@ijia/data/db";
import { AudioAssetDto, ImageAssetDto, ImageInfoDto, MulFormat, VideoAssetDto } from "./common.dto.ts";
import { checkValue } from "@/global/check.ts";
import { enumType, integer, optional } from "@asla/wokao";
import { HonoContext } from "@/hono/type.ts";
import { rolesGuard } from "@/global/auth.ts";

function getPostAssetsType(typeBit: string): PostAssetType {
  const type = parseInt(typeBit, 2);
  return {
    hasText: (type & 0b0001) != 0,
    hasImage: (type & 0b0010) != 0,
    hasAudio: (type & 0b0100) != 0,
    hasVideo: (type & 0b1000) != 0,
  };
}
@Use(rolesGuard)
@autoBody
@Controller({})
class PostController {
  @ToArguments(async (ctx: HonoContext) => {
    const user = await ctx
      .get("userInfo")
      .getJwtInfo()
      .catch(() => null);

    const params = checkValue(ctx.req.query(), {
      number: optional(integer({ acceptString: true, min: 1, max: 100 })),
      offset: optional(integer({ acceptString: true, min: 0 })),
      platform: optional(enumType(Array.from(enumPlatform))),
      userId: optional.string,
      s_content: optional.string,
      s_author: optional.string,
    });

    return [params, user ? +user.userId : undefined];
  })
  @Get("/live/posts")
  async getAssetList(option: GetPostListParam = {}, userId?: number): Promise<LivePostResponse> {
    const DEFAULT_NUMBER = 10;
    const LIMIT = 10;
    if (option.offset === undefined) option.offset = 0;
    if (option.number === undefined) option.number = DEFAULT_NUMBER;

    let needLogin = false;
    if (!userId) {
      if (option.offset + option.number > LIMIT) {
        option.offset = 0;
        if (option.number > LIMIT) option.number = LIMIT;
        needLogin = true;
      }
    }
    const { items: raw, total } = await selectAssetList(option);
    if (needLogin) {
      return { items: [], total, needLogin: true };
    }

    const list = raw.map((item): AssetItemDto => {
      const type = getPostAssetsType(item.type);

      const videoFormats = moveArr(groupByIndex(item.video ?? []), 1).map((items) =>
        items ? toFormats(items, videoToDto) : {},
      );
      const [cover, ...imageFormats] = groupByIndex(item.image ?? []).map((items) =>
        items ? toFormats(items, imageToDto) : {},
      );
      const audioFormats = moveArr(groupByIndex(item.audio ?? []), 1).map((items) =>
        items ? toFormats(items, audioToDto) : {},
      );

      const imageList = imageFormats.map((item): ImageAssetDto | undefined => {
        const { [MediaLevel.origin]: origin, ...formats } = item;
        if (!origin) return undefined;
        return { formats, origin };
      });

      const videoList = videoFormats.map((item, index): VideoAssetDto | undefined => {
        const { [MediaLevel.origin]: origin, ...formats } = item;
        if (!origin) return undefined;
        const covers = index === 0 ? cover : undefined;
        return {
          covers,
          cover: covers ? getCover(covers) : undefined,
          origin,
          formats,
        };
      });
      const audioList = audioFormats.map((item, index): AudioAssetDto | undefined => {
        const { [MediaLevel.origin]: origin, ...formats } = item;
        if (!origin) return undefined;
        const covers = index === 0 ? cover : undefined;
        return {
          covers,
          cover: covers ? getCover(covers) : undefined,
          formats,
          origin,
        };
      });
      const authRaw = item.author;
      const author: AssetItemDto["author"] = {
        user_name: authRaw.user_name,
        user_id: authRaw.user_id,
        avatar_url: authRaw.avatar_url,
        home_page: undefined,
      };
      let url: string | undefined;

      //TODO:补充其他平台
      switch (item.platform) {
        case Platform.douYin: {
          url = `https://www.douyin.com/video/${item.asset_id}`;
          author.home_page = `https://www.douyin.com/user/${item.author.extra?.sec_uid}`;
          break;
        }
        case Platform.bilibili:
          break;
        case Platform.xiaoHongShu:
          break;
        case Platform.weibo: {
          url = `https://weibo.com/${author.user_id}/${item.asset_id}`;
          author.home_page = `https://weibo.com/u/${author.user_id}`;

          const expireTime = (86400 * 365 * 1000) / 2; //TODO: 改为可配置

          if (Date.now() - item.publish_time.getTime() > expireTime) {
            item.content_text = "微博不可见";
            item.content_text_structure = null;
            imageList.length = 0;
            videoList.length = 0;
            audioList.length = 0;
          }
          // 是否可见
          break;
        }
        case Platform.v5sing:
          break;
        case Platform.wangYiMusic:
          break;
        default:
          break;
      }

      return {
        asset_id: item.asset_id,

        author,
        content_text: item.content_text,
        content_text_structure: item.content_text_structure,
        publish_time: item.publish_time?.toISOString(),
        ip_location: item.ip_location,
        platform: item.platform,
        type,
        videoList,
        audioList,
        imageList,
        url,
      };
    });
    return { items: list, total, needLogin };
  }
}
function getCover(format: MulFormat<ImageInfoDto>) {
  const formats = [MediaLevel.thumb, MediaLevel.origin];
  for (const item of formats) {
    if (format[item]) return format[item];
  }
}
function moveArr<T>(arr: T[], offset: number) {
  if (arr.length) {
    // 向左移动一位，因为 index 0 是封面
    arr[0] = arr[1];
    const max = -arr.length - 1;
    for (let i = 0; i < max; i++) {
      arr[i] = arr[i + 1];
    }
    arr.length -= offset;
  }
  return arr;
}
export const postController = new PostController();
