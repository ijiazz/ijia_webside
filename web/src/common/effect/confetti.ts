import { randomNormal } from "@/lib/random.ts";
import confetti, { Options } from "canvas-confetti";
console.warn("confetti loaded");

export function playConfetti() {
  for (let i = 0; i < 100; i++) {
    confetti({
      origin: { y: nRandomRange(0.35, 0.1), x: nRandomRange(0.5, 0.3) },
      angle: nRandomRange(90, 45),
      spread: nRandomRange(45, 7),
      startVelocity: nRandomRange(45, 35),
      decay: nRandomRange(0.9, 0.02),
      scalar: nRandomRange(1, 0.5),
      ticks: 1000,
      particleCount: 10,
    });
  }

  return {
    stop() {},
  };
}
document.body.style.backgroundColor = "#000";

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
