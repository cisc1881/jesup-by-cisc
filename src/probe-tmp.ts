import { useQuery } from "@tanstack/react-query";
import { fetchPrograms } from "@/lib/programs";
export function probe() {
  const { data } = useQuery({ queryKey: ["programs"], queryFn: () => fetchPrograms() });
  const x: unknown = data;
  return x;
}
