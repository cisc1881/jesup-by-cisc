#!/usr/bin/env node
/**
 * Generate development VAPID keys for Web Push (Sprint 11 Phase 2).
 * Do not use output keys in production without a separate generation step.
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("Development VAPID keys generated.\n");
console.log("Add to .env (never commit real private keys to git):\n");
console.log(`VITE_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
console.log('VAPID_SUBJECT="mailto:info@accessfarmtotable.com"');
console.log("\nPrivate key is server-only. Public key is safe for the browser bundle.");
