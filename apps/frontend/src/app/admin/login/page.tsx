"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin Login Route
 *
 * Requirements:
 * - Do NOT render a standalone admin login page UI.
 * - Redirect to the homepage and open the existing website login modal via ?auth=login.
 */
export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?auth=login");
  }, [router]);

  return null;
}
