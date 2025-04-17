/**
 * Generates a random number following a normal distribution
 * using the Box-Muller transform.
 *
 * @param mean - The mean (μ) of the normal distribution.
 * @param stdDev - The standard deviation (σ) of the normal distribution.
 * @returns A random number following the specified normal distribution.
 */
export function randomNormal(mean: number = 0, stdDev: number = 1): number {
  let u = Math.random();
  let v = Math.random();

  while (u === 0) u = Math.random(); // 确保 u 不为 0
  while (v === 0) v = Math.random(); // 确保 v 不为 0
  const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z0 * stdDev + mean;
}
