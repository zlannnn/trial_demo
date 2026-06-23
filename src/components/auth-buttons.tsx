"use client";

import { signIn, useSession } from "next-auth/react";

import { Button } from "~/components/ui/button";

export function GoogleSignInButton() {
  return (
    <Button
      type="button"
      className="w-full"
      onClick={() => void signIn("google", { callbackUrl: "/chat" })}
    >
      使用 Google 登录
    </Button>
  );
}

export function SignOutButton() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
        void import("next-auth/react").then(({ signOut }) =>
          signOut({ callbackUrl: "/login" }),
        )
      }
    >
      退出
    </Button>
  );
}
