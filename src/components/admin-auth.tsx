"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export function AdminSignInForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("admin-credentials", {
      username,
      password,
      redirect: false,
      callbackUrl: "/admin",
    });

    setLoading(false);

    if (result?.error) {
      setError("账号或密码错误");
      return;
    }

    window.location.href = "/admin";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="admin-username" className="text-sm font-medium">
          管理员账号
        </label>
        <Input
          id="admin-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          autoComplete="username"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="admin-password" className="text-sm font-medium">
          密码
        </label>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="admin"
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "登录中…" : "管理员登录"}
      </Button>
    </form>
  );
}

export function AdminSignOutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
        void import("next-auth/react").then(({ signOut }) =>
          signOut({ callbackUrl: "/admin/login" }),
        )
      }
    >
      退出管理后台
    </Button>
  );
}
