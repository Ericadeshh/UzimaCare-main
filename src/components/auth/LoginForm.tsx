"use client";

import { useSearchParams } from "next/navigation";
import { SignInForm } from "./SignInForm";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  // Default to patient if no role specified
  const role =
    roleParam === "admin" ||
    roleParam === "physician" ||
    roleParam === "patient"
      ? roleParam
      : "patient";

  return <SignInForm defaultRole={role} />;
}
