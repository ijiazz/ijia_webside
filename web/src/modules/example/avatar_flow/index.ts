import { createImageStream, getOssThumbBlobName, CommentStatByCount } from "./image_stream.ts";
function createImg() {
  const img = document.createElement("img");
  img.onerror = function () {
    this.style.opacity = "0";
  };
  img.className = "avatar";
  return img;
}
function createElement(config: CardConfig, y: number, x: number) {
  const { width, height } = config;
  const ele = document.createElement("div");
  ele.style.height = height + "px";
  ele.style.width = width + "px";
  ele.className = "element";
  ele.appendChild(createImg());
  const name = document.createElement("div");
  name.className = "username";
  ele.appendChild(name);
  return ele;
}
function genList(root: HTMLElement, cardConfig: CardConfig) {
  const { gap, height, width } = cardConfig;

  let contentHeight = height + gap / 2;
  let left: number; //容器左边距
  const cacheNumber = 5; //缓冲行数
  let colNum: number;
  let rowNum: number;

  {
    const rootWidth = root.clientWidth;
    colNum = Math.floor(rootWidth / (width + gap));
    rowNum = Math.floor(root.clientHeight / (contentHeight + gap)) + cacheNumber;
    const contentWidth = colNum > 0 ? colNum * width + colNum * gap : 0;
    left = Math.floor((rootWidth - contentWidth) / 2);
  }
  const rows = new Array<HTMLElement>(rowNum);
  let topOffset = 20;
  for (let y = 0; y < rowNum; y++) {
    const element = document.createElement("div");
    element.style.gap = gap + "px";
    element.style.left = left + "px";
    element.className = "row";
    element.style.height = contentHeight + "px";
    element.style.top = topOffset + y * (contentHeight + gap) + "px";

    const cols = new Array(colNum);
    rows[y] = element;
    for (let x = 0; x < colNum; x++) {
      cols[x] = createElement(cardConfig, y, x);
      element.appendChild(cols[x]);
    }

    root.appendChild(element);
  }
  return { rows, object: root, topOffset: (rowNum - 1) * (contentHeight + gap), colNum, rowNum };
}
async function renderRow(stream: ReadableStreamDefaultReader<CommentStatByCount>, row: HTMLElement) {
  const rowsElement = row.children;

  for (let i = 0; i < rowsElement.length; i++) {
    const div = rowsElement[i] as HTMLDivElement;
    const img = div.firstElementChild as HTMLImageElement | undefined;
    const name = div.lastElementChild as HTMLDivElement;
    const image = await stream.read();
    if (img) {
      if (image.done) {
        div.removeChild(img);
      } else {
        const info = image.value;
        img.src = getOssThumbBlobName(info.avatar);
        img.style.opacity = "1";
        name.innerText = info.comment_total + "." + info.user_name;
      }
    }
  }
}
async function initRows(stream: ReadableStreamDefaultReader<CommentStatByCount>, rows: HTMLElement[]) {
  for (const row of rows) {
    await renderRow(stream, row);
  }
}
function init() {
  const cardConfig: CardConfig = { gap: 20, width: 100, height: 100 };
  const root = document.getElementById("container") as HTMLDivElement;
  const { rows, topOffset, colNum } = genList(root, cardConfig);

  const stream = createImageStream(colNum * 5).getReader();

  const animation = new Animation(cardConfig.height + cardConfig.gap, topOffset, (i) => renderRow(stream, rows[i]));
  animation.elements = rows;

  initRows(stream, rows).then(() => {
    setTimeout(() => {
      animation.speed = 1;
      animation.start();
    }, 4000);
    setTimeout(() => (animation.speed = 2), 5000);
  });

  document.addEventListener("keypress", (e) => {
    if (e.code === "Space") {
      animation.stop();
    }
  });
}
class Animation {
  constructor(
    elementHeight: number,
    resetTop: number,
    private onOver: (i: number) => void,
  ) {
    this.limit = -elementHeight;
    this.resetTop = resetTop;
  }
  speed = 2;
  #stop = true;
  start() {
    if (!this.#stop) return;
    this.#stop = false;
    this.#render();
  }
  stop() {
    this.#stop = true;
  }
  elements: HTMLElement[] = [];
  private resetTop: number;
  private limit: number;
  #render = () => {
    if (this.#stop) return;
    requestAnimationFrame(this.#render);
    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i];
      let next = element.offsetTop - this.speed;
      if (next < this.limit) {
        element.style.top = this.resetTop + "px";
        this.onOver(i);
      } else element.style.top = next + "px";
    }
  };
}
init();

interface CardConfig {
  width: number;
  height: number;
  gap: number;
}
