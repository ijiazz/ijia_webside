declare module "react" {
  interface CSSProperties {
    // Allow any CSS Custom Properties
    [index: `--${string}`]: any;
  }
}
