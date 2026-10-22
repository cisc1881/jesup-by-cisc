import { useQuery } from "@tanstack/react-query";
import { School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInstitutionTheme } from "@/components/institution-theme-provider";
import { listInstitutions } from "@/lib/institutions";

export function GuestSchoolPicker() {
  const { isGuest, institutionName, selectGuestSchool } = useInstitutionTheme();
  const { data: schools = [], isError, refetch } = useQuery({ queryKey: ["guest-school-options"], enabled: isGuest, queryFn: () => listInstitutions({ includeOther: false }) });
  if (!isGuest) return null;
  if (isError) return <Button variant="outline" size="sm" onClick={() => void refetch()}>Retry school list</Button>;
  return <Select value={institutionName ?? "network"} onValueChange={name => selectGuestSchool(name === "network" ? null : name)}>
    <SelectTrigger aria-label="Choose school" className="min-h-11 w-11 shrink-0 gap-1 px-2 sm:w-48"><School className="size-4 shrink-0" aria-hidden="true" /><span className="hidden min-w-0 truncate sm:block"><SelectValue placeholder="Choose school" /></span></SelectTrigger>
    <SelectContent><SelectItem value="network">JESUP · No school selected</SelectItem>{schools.map(school => <SelectItem key={school.id} value={school.name}>{school.name}</SelectItem>)}</SelectContent>
  </Select>;
}