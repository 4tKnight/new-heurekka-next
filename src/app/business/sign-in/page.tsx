import type { Metadata } from "next";

import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in · Heurekka for business" };

export default function Page() {
  return <AuthForm mode="signin" />;
}
