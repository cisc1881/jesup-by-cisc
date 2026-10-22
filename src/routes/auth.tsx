import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { resolvePostLoginPathForUser, validateNextPath } from "@/lib/auth-redirect";
import { toast } from "sonner";
import { JesupLogoMark } from "@/components/branding";
import { buildPageHead } from "@/lib/seo";

const searchSchema = z.object({
  next: z
    .string()
    .optional()
    .transform((val) => validateNextPath(val) ?? undefined),
  mode: z.enum(["reset"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => buildPageHead({ title: "Sign in · JESUP by CISC", description: "Access your JESUP registrations, event credentials, and personal workspace.", path: "/auth", noindex: true }),
  component: AuthPage,
});

function AuthPage() {
  const { next, mode } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const returnTo = `${typeof window === "undefined" ? "" : window.location.origin}${validateNextPath(next) ?? ""}`;

  useEffect(() => {
    if (mode === "reset") return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return;
      const destination = await resolvePostLoginPathForUser(next, data.session.user.id);
      if (destination.includes("?")) {
        window.location.replace(destination);
        return;
      }
      void navigate({ to: destination as "/", replace: true });
    });
  }, [mode, navigate, next]);


  async function redirectAfterAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      void navigate({ to: "/me", replace: true });
      return;
    }
    const destination = await resolvePostLoginPathForUser(next, user.id);
    // Paths with a query string (e.g. the OAuth consent screen) are not typed
    // router targets — hand those to the browser directly.
    if (destination.includes("?")) {
      window.location.replace(destination);
      return;
    }
    void navigate({ to: destination as "/", replace: true });
  }


  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    await redirectAfterAuth();
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: returnTo, data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email if confirmation is required.");
    await redirectAfterAuth();
  }

  async function requestPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setResetEmailSent(true);
    toast.success("Password reset email sent");
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      return toast.error("Use at least 8 characters for your new password.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("The passwords do not match.");
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. You are signed in.");
    await redirectAfterAuth();
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: returnTo,
    });
    if (result.error) toast.error(result.error.message || "Google sign-in failed");
  }

  async function apple() {
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: returnTo,
    });
    if (result.error) toast.error(result.error.message || "Apple sign-in failed");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto" aria-label="JESUP home">
            <JesupLogoMark size="lg" tone="on-light" imageClassName="h-auto w-[min(15rem,70vw)]" />
          </Link>
          <CardTitle className="font-serif text-2xl text-primary">Welcome to JESUP</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to register for programs and manage your activity.
          </p>
        </CardHeader>
        <CardContent>
          {mode === "reset" ? (
            <form onSubmit={updatePassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter a new password for your JESUP account.
              </p>
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-primary hover:bg-primary/90">
                {busy ? "Updating…" : "Update password"}
              </Button>
            </form>
          ) : forgotPassword ? (
            resetEmailSent ? (
              <div className="space-y-4 text-center">
                <p className="font-medium text-primary">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  If an account exists for {email}, a secure password-reset link has been sent.
                </p>
                <Button type="button" variant="outline" className="w-full" onClick={() => {
                  setForgotPassword(false);
                  setResetEmailSent(false);
                }}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={requestPasswordReset} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your account email and we’ll send you a secure reset link.
                </p>
                <div>
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-primary hover:bg-primary/90">
                  {busy ? "Sending…" : "Send reset link"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setForgotPassword(false)}>
                  Back to sign in
                </Button>
              </form>
            )
          ) : (
            <>
          <Button onClick={google} variant="outline" className="mb-2 w-full">
            Continue with Google
          </Button>
          <Button
            onClick={apple}
            variant="outline"
            className="mb-4 w-full bg-black text-white hover:bg-black/90 hover:text-white"
          >
            <svg viewBox="0 0 384 512" className="mr-2 h-4 w-4 fill-current" aria-hidden="true">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            Continue with Apple
          </Button>
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3">
                <div>
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
