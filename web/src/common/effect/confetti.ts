import { randomNormal } from "@/lib/random.ts";
import confetti, { Options } from "canvas-confetti";
console.warn("confetti loaded");

function fireConfetti(angle: number, x: number = 0.5, y: number = 0.35, count = 100, zoom1: number = 1) {
  const rz = 5;
  for (let i = 0; i < count; i += rz) {
    const zoom = zoom1 * nRandomRange(1, 0.5);
    confetti({
      origin: { y, x },
      angle,
      spread: nRandomRange(45, 7), //发射角度偏移
      startVelocity: nRandomRange(45, 35),
      decay: nRandomRange(0.905, 0.02), // 初速度
      scalar: zoom, //彩带大小
      gravity: 1 - (1 - zoom) * 0.7, // 重力
      ticks: 2000, // 存活时间
      particleCount: rz,
    });
  }
}

const midWith = 1400;
const minWith = 500;
const minZoom = 0.7;
const maxZoom = 1.2;
const k = (1 - minZoom) / (midWith - minWith);
const b = 1 - k * midWith;
export function playConfetti(windowWidth: number) {
  let zoom = k * windowWidth + b;
  if (zoom < minZoom) zoom = minZoom;
  if (zoom > maxZoom) zoom = maxZoom;
  const r = 56;
  const min = 90 - r;
  const max = 90 + r;
  for (let i = min; i < max; i += 10) {
    fireConfetti(i, 0.5, 0.35, 100 * zoom, zoom);
  }

  return {
    stop() {},
  };
}

type SnowOption = {
  /** 粒子生命周期。  */
  duration?: number;
};
function genSnowPoint(option: SnowOption = {}) {
  const duration = (option.duration || 3) * 60;

  confetti({
    particleCount: 1,
    startVelocity: 0,
    ticks: duration,
    origin: {
      x: Math.random(),
      y: 0,
    },
    colors: ["#ffffff"],
    shapes: ["circle"],
    gravity: randomRange(0.4, 0.6),
    scalar: nRandomRange(0.2, 0.1),
    drift: nRandomRange(0, 0.4),
    flat: true,
  });
}
export function playSnow() {
  let stop = false;
  const config: SnowOption = { duration: 20 };
  function emit() {
    if (stop) return;
    if (Math.random() > 0.6) genSnowPoint(config);
    requestAnimationFrame(emit);
  }
  emit();
  return { stop() {} };
}

function genRain() {
  const duration = 1 * 60;

  confetti({
    particleCount: 1,
    angle: -90,
    startVelocity: 1,
    ticks: duration,
    origin: {
      x: Math.random(),
      y: 0,
    },
    colors: ["#ffffff"],
    shapes: ["circle"],
    gravity: 30,
    decay: 1,
    scalar: nRandomRange(0.2, 0.1),
    drift: nRandomRange(0, 0.03),
    flat: true,
  });
}

export function playRain() {
  let stop = false;
  function emit() {
    if (stop) return;
    genRain();
    requestAnimationFrame(emit);
  }
  emit();
  return { stop() {} };
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function nRandomRange(mid: number, offset: number) {
  if (offset < 0) throw new Error("offset 必须大于0");
  let min = mid - offset;
  let max = mid + offset;

  return randomRange(min, max);
}
