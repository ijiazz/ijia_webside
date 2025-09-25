import { CaptionType, Dialogue } from "@/lib/components/talk.tsx";
import come_across from "../-img/come_across.jpg";
import be1 from "../-img/be1.jpg";
import be2 from "../-img/be2.jpg";
import finish_school from "../-img/finish_school.jpg";
import verify from "../-img/verify.jpg";

export const comeAcross: Dialogue = {
  branch: {
    a: [{ type: CaptionType.MONOLOGUE, text: "画个屁展！", id: "1" }],
    b: [{ type: CaptionType.MONOLOGUE, text: "你！臭流氓", id: "1" }],
    c: [{ type: CaptionType.MONOLOGUE, text: "不生气不生气，生气就是惩罚自己，忍一忍忍一忍，坏人全部被创死", id: "1" }],
  },
  captions: [
    { type: CaptionType.MONOLOGUE, text: "你好，有没有看到我的手机啊？", id: "1" },
    { type: CaptionType.MONOLOGUE, text: "你怎么会有我的手机啊？", id: "1" },
    {
      type: CaptionType.QUESTION,
      text: "啊？昨晚那么混蛋的事都干得出来，你忘了？",
      answers: [
        { text: "我们是在画展上认识的？", value: "a" },
        { text: "昨晚咱俩？那什么了？", value: "b" },
        { text: "别再问我记不记得了", value: "c" },
      ],
      id: "1",
    },
  ],
  background: {
    image_url: come_across,
  },
};
export const finishSchool: Dialogue = {
  branch: {},
  captions: [
    {
      type: CaptionType.MONOLOGUE,
      text: "毕业典礼，家里人怎么能不出现呢？",
      id: "1",
    },
    {
      type: CaptionType.MONOLOGUE,
      text: "顾易哥",
      id: "1",
    },
    {
      type: CaptionType.MONOLOGUE,
      text: "别傻站着了，来我来给你拍照",
      id: "1",
    },
  ],
  background: { image_url: finish_school },
};

export const verifyCard: Dialogue = {
  branch: {},
  captions: [
    {
      type: CaptionType.QUESTION,
      text: "你会...  你会一直陪着我的吧？",
      id: "1",
      answers: [
        { text: "会的！", value: "yes" },
        { text: "不会！", value: "no" },
      ],
    },
  ],
  background: { image_url: verify },
};

export const be1Card: Dialogue = {
  branch: {},
  captions: [{ type: CaptionType.MONOLOGUE, text: "可以不走吗？", id: "0" }],
  background: { image_url: be1 },
};
export const be2Card: Dialogue = {
  branch: {},
  captions: [{ type: CaptionType.MONOLOGUE, text: "既然这样的话，那我以后就不会再纠缠你了。", id: "0" }],
  background: { image_url: be2 },
};
/* 
 

你会...  你会一直陪着我的吧？



真的会一直都在吗？    

尊嘟假嘟，这种话我可是听过好多次了，该走的还是走了

哈哈，没关系我会珍惜当下的。
不知道明年大家还在不在


虽然不知道你们还在不在，希望到时候你们还在拉
我知道你们有时候说自己是小丑，是跟我开玩笑的，但是你们要知道，你们不是小丑！
有很多人说自己是什么臭打游戏的，所以不要再说自己是臭大游戏的了，我希望你们能和我一起变得越来越自信
*/
