export function getUrlByRouter(router: string) {
  return location.origin + getPathByRouter(router);
}
export function getPathByRouter(router: string) {
  return `/x/#${router}`;
}
