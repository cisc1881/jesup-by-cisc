import { QueryClient } from "@tanstack/react-query";

/** Shared React Query defaults for JESUP. */
export const QUERY_STALE_TIME = 60_000;
export const QUERY_GC_TIME = 5 * 60_000;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export const HOME_PAGE_QUERY_KEY = ["home-page"] as const;
export const UNIVERSAL_SEARCH_QUERY_KEY = ["universal-search"] as const;

export function universalSearchQueryKey(query: string) {
  return [...UNIVERSAL_SEARCH_QUERY_KEY, query.trim()] as const;
}
