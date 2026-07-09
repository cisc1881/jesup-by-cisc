import { useQuery } from "@tanstack/react-query";
import { fetchHomePageData } from "@/lib/home";

export function useHomeData() {
  return useQuery({
    queryKey: ["home-page"],
    queryFn: fetchHomePageData,
    staleTime: 60_000,
  });
}
