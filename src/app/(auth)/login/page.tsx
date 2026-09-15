import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Masuk ke StrukScan</CardTitle>
      </CardHeader>
      <CardContent>
        {/* LoginForm pakai useSearchParams (callbackUrl) — wajib Suspense boundary di App Router. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
