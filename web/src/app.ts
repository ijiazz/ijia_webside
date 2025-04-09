export function getUrlByRoute(route: string) {
  return location.origin + getPathByRoute(route);
}
export function getPathByRoute(route: string) {
  if (!route.startsWith("/")) throw new Error("router must start with /");
  const base = import.meta.env?.BASE_URL ?? "/";
  if (base.endsWith("/")) return base + route.slice(1);
  return route;
}

export function remoteLoading() {
  const element = document.getElementById("app-loading");
  if (element) {
    element.remove();
  }
}

export const ROUTES = {
  Home: "/",
  Login: "/passport/login",
} as const;
