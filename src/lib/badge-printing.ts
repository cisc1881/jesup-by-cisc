export type EventBadgeData = {
  attendeeName: string;
  eventTitle: string;
  organization?: string | null;
  ticketCode?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function printEventBadge(data: EventBadgeData) {
  const frame = document.createElement("iframe");
  frame.setAttribute("title", `Print badge for ${data.attendeeName}`);
  frame.style.position = "fixed";
  frame.style.width = "1px";
  frame.style.height = "1px";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.border = "0";
  const logo = `${window.location.origin}/branding/jesup-by-cisc-metallic-gold.svg`;

  frame.srcdoc = `<!doctype html>
<html><head><meta charset="utf-8"><title>JESUP badge</title>
<style>
  @page { size: 4in 3in; margin: 0; }
  * { box-sizing: border-box; }
  html, body { width: 4in; height: 3in; margin: 0; font-family: Arial, sans-serif; color: #161616; }
  .badge { width: 4in; height: 3in; overflow: hidden; border: 0.04in solid #8b0015; display: flex; flex-direction: column; background: white; }
  .top { height: 0.66in; display: flex; align-items: center; justify-content: space-between; gap: 0.12in; padding: 0.08in 0.16in; background: #130f10; }
  .logo { width: 1.24in; max-height: 0.48in; object-fit: contain; }
  .event { max-width: 2.25in; color: white; font-size: 10pt; font-weight: 700; line-height: 1.12; text-align: right; }
  .body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.12in 0.22in; text-align: center; }
  .hello { color: #8b0015; font-size: 10pt; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
  .name { margin-top: 0.07in; font-family: Georgia, serif; font-size: 27pt; font-weight: 800; line-height: 1.03; overflow-wrap: anywhere; }
  .org { margin-top: 0.09in; font-size: 12pt; font-weight: 600; color: #555; }
  .code { min-height: 0.36in; padding: 0.08in 0.16in; background: #f1bd32; color: #17120b; font-family: ui-monospace, monospace; font-size: 10pt; font-weight: 800; letter-spacing: 0.04em; text-align: center; }
</style></head><body>
<main class="badge">
  <header class="top"><img class="logo" src="${logo}" alt="JESUP by CISC"><div class="event">${escapeHtml(data.eventTitle)}</div></header>
  <section class="body"><div class="hello">Welcome</div><div class="name">${escapeHtml(data.attendeeName)}</div>${data.organization ? `<div class="org">${escapeHtml(data.organization)}</div>` : ""}</section>
  <footer class="code">${escapeHtml(data.ticketCode || "JESUP GUEST")}</footer>
</main></body></html>`;

  frame.onload = () => {
    window.setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 1_000);
    }, 250);
  };
  document.body.appendChild(frame);
}

