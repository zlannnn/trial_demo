import Link from "next/link";

import { AdminSignInForm } from "~/components/admin-auth";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">管理后台</h1>
          <p className="text-sm text-muted-foreground">
            登录后可查看全部用户的外呼记录
          </p>
        </div>
        <AdminSignInForm />
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            返回用户登录
          </Link>
        </p>
      </div>
    </div>
  );
}
