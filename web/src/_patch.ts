declare module "react" {
  interface CSSProperties {
    // Allow any CSS Custom Properties
    [index: `--${string}`]: any;
  }
}
declare global {
  /** The build time of the application */
  const __APP_BUILD_TIME: number | undefined;
}
