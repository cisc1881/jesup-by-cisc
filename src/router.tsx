import { createAppQueryClient, QUERY_STALE_TIME } from "./lib/query-config";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = createAppQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: QUERY_STALE_TIME,
  });

  return router;
};
