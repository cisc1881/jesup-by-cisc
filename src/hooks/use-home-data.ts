import { useQuery } from "@tanstack/react-query";
import { fetchHomePageData } from "@/lib/home";
import { HOME_PAGE_QUERY_KEY, QUERY_STALE_TIME } from "@/lib/query-config";

export function useHomeData() {
  return useQuery({
    queryKey: HOME_PAGE_QUERY_KEY,
    queryFn: fetchHomePageData,
    staleTime: QUERY_STALE_TIME,
  });
}
