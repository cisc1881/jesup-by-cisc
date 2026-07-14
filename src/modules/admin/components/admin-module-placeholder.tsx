import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import { Card, CardContent } from "@/components/ui/card";

type AdminModulePlaceholderProps = {
  title: string;
  description: string;
};

export function AdminModulePlaceholder({ title, description }: AdminModulePlaceholderProps) {
  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader title={title} description={description} />
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            This module is on the Command Center roadmap. Management tools will be added in a future release.
          </p>
        </CardContent>
      </Card>
    </CommandCenterContentShell>
  );
}
