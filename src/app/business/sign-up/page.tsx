import type { Metadata } from "next";

import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Create a business account · Heurekka for business" };

export default function Page() {
  return <AuthForm mode="signup" />;
}
