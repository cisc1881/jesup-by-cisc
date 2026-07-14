import { Link } from "@tanstack/react-router";
import { HOME_QUICK_ACTIONS } from "@/lib/home";
import { QuickActionTile } from "@/components/design-system";

export function HomeQuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {HOME_QUICK_ACTIONS.map((action) => (
        <QuickActionTile key={action.to} to={action.to} label={action.label} icon={action.icon} />
      ))}
    </div>
  );
}

export function HomeQuickActionsSection() {
  return (
    <section aria-labelledby="home-quick-actions">
      <h2 id="home-quick-actions" className="sr-only">
        Quick actions
      </h2>
      <HomeQuickActions />
    </section>
  );
}
