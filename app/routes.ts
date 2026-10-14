import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("pages/login.tsx"),
  route("main", "pages/main.tsx"),
] satisfies RouteConfig;
