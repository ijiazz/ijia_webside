import { Caption } from "@/lib/components/talk/type.ts";

export const flashTextList: Caption[] = [
  {
    text: "祝邹佳佳10月28日生日快乐！",
    speed: 8,
    pauseMs: 400,
    segments: [
      { length: 1, speed: 4, pauseMs: 200 },
      { length: 3, speed: 6 },
      { length: 6, speed: 6, pauseMs: 200 },
      { length: 5, speed: 6 },
    ],
  },
  /* {
    text: "我们互相保护！",
    speed: 8,
    pauseMs: 800,
    segments: [
      { length: 2, speed: 4 },
      { length: 5, speed: 6 },
    ],
  },
  {
    text: "我喜欢的小偶像叫邹佳佳！她一点都不垃圾，饭她很幸福！",
    speed: 7,
    pauseMs: 800,
    segments: [{ length: 7, speed: 6, pauseMs: 250 }, { length: 5, speed: 8 }, 8, 6],
  }, */
];
export const extend: Caption[] = [
  {
    text: "谢谢宝宝们，回头看你们都在，嘿嘿",
    speed: 6,
    pauseMs: 800,
    segments: [6, { length: 3, pauseMs: 200 }, 5, 2],
  },
];
