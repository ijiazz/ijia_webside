import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_theme/about/guide")({
  head(ctx) {
    return {
      meta: [
        { name: "description", content: "IJIA学院入学指南，帮助新同学们快速融入IJIA大家庭，开启精彩的学习之旅。" },
        { name: "keywords", content: "IJIA学院, 入学指南, 新生报到, 校园活动, 学术名词" },
      ],
      title: "入学指南",
    };
  },
});
