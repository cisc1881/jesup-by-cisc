import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listEventsTool from "./tools/list-events";
import listMarketsTool from "./tools/list-markets";
import listMyRegistrationsTool from "./tools/list-my-registrations";
import registerForEventTool from "./tools/register-for-event";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "jesup-by-cisc",
  title: "Jesup by CISC",
  version: "0.1.0",
  instructions:
    "Tools for JESUP, the Digital Extension Wagon from the Carver Integrative Sustainability Center at Tuskegee University. Use `list_events` and `list_markets` to browse upcoming programs and farmers markets, `list_my_registrations` to see the signed-in user's registrations, and `register_for_event` to sign them up for an event.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listEventsTool, listMarketsTool, listMyRegistrationsTool, registerForEventTool],
});
