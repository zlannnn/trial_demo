import { GoogleSignInButton } from "~/components/auth-buttons";
import { isGoogleAuthConfigured } from "~/env";

export default function LoginPage() {
  const googleReady = isGoogleAuthConfigured();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">J-Ghost</h1>
          <p className="text-sm text-muted-foreground">
            学资保险契约确认 — 请登录后继续
          </p>
        </div>
        {googleReady ? (
          <GoogleSignInButton />
        ) : (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            请在 <code className="text-xs">.env.local</code> 中配置{" "}
            <code className="text-xs">AUTH_GOOGLE_ID</code> 和{" "}
            <code className="text-xs">AUTH_GOOGLE_SECRET</code>
            ，然后重启开发服务器。
          </p>
        )}
      </div>
    </div>
  );
}
