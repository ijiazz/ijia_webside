import { createLazyFileRoute } from "@tanstack/react-router";
import React from "react";
import p01Src from "./-img/p01.webp";
import { DocsBoard } from "./-components/DocsBoard.tsx";

export const Route = createLazyFileRoute("/_theme/about/introduction")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DocsBoard>
      <CollegeIntroduction />
    </DocsBoard>
  );
}

const CollegeIntroduction: React.FC = () => (
  <>
    <h2>IJIA学院简介</h2>
    <p>
      IJIA学院是一所专注于IJIA领域人才培养的特色学院，由佳佳子校长亲自创办并担任校长一职。学院自成立以来，始终秉持着创新、包容、奋进的教育理念，致力于为广大学子打造一个充满活力与机遇的学习平台。
    </p>
    <h3>创始人与校长：佳佳子</h3>
    <p>
      佳佳子校长是IJIA领域的杰出代表，以其独特的教学风格和深厚的专业知识深受学生们的喜爱。她不仅在学术上有着卓越的成就，更以其亲和力和幽默感，为学院营造了一个轻松愉快的学习氛围。在她的带领下，IJIA学院迅速发展成为IJIA领域的重要教育基地。
    </p>
    <h3>开学典礼</h3>
    <p>
      IJIA学院的第一次开学典礼于2024年8月17日在上海隆重举行，这一天标志着学院正式开启招生之旅。开学典礼上，佳佳子校长发表了热情洋溢的讲话，鼓励学生们在学院中努力学习、追求卓越。她强调了IJIA文化的重要性，并呼吁学生们积极参与学院的各项活动，共同创造属于IJIA学院的辉煌未来。
      <br /> <br />
      <img src={p01Src} style={{ objectFit: "cover", maxWidth: "100%" }} />
      <center>
        <i style={{ fontSize: 12 }}>2024年8月17日开学典礼大合照</i>
      </center>
    </p>
    <h3>学院文化</h3>
    <p>
      IJIA学院有着丰富而独特的文化内涵，其中包含了许多具有代表性的学术名词，如“阿坝州野牦牛”“哦莫哦莫”“可恶”等。这些名词不仅是学院文化的重要组成部分，也是学生们之间情感交流的纽带。通过这些独特的文化符号，学生们能够更好地融入学院大家庭，感受到IJIA学院的温暖与力量。
    </p>
    <h3>学院活动</h3>
    <p>
      IJIA学院注重学生的全面发展，举办了一系列丰富多彩的活动。其中，IJIA大课堂是学院的核心课程，由佳佳子校长亲自授课，课程内容丰富且权威，深受学生们的喜爱。此外，学院还定期举办班级学术交流会、线下学术交流会等活动，为学生们提供了广阔的交流与学习平台。
    </p>
    <h3>学院愿景</h3>
    <p>
      IJIA学院致力于培养具有创新精神和实践能力的IJIA专业人才，为IJIA领域的发展贡献力量。学院将继续秉承“创新、包容、奋进”的教育理念，不断优化教学内容和方法，为学生们提供更优质的学习资源和环境。我们相信，在佳佳子校长的领导下，IJIA学院将迎来更加辉煌的明天。
    </p>

    <i style={{ fontSize: 14 }}>(本简介仅用于娱乐)</i>
  </>
);
