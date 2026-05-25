"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { isFirebaseClientConfigured } from "@/core/env/public";
import { getClientAuth } from "@/lib/firebase/client";
import { Button } from "@/shared/components/button";
import { Card, CardTitle } from "@/shared/components/card";
import { FormField, TextInput } from "@/shared/forms/form-field";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setErrorMessage(null);
    setIsPending(true);

    try {
      if (!isFirebaseClientConfigured()) {
        throw new Error(
          "Firebase client environment variables are missing. Add your NEXT_PUBLIC_FIREBASE_* values first.",
        );
      }

      const credential = await signInWithEmailAndPassword(
        getClientAuth(),
        values.email,
        values.password,
      );
      const idToken = await credential.user.getIdToken(true);

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Oturum başlatılamadı");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Şu anda giriş yapılamıyor.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md rounded-[2rem] border-white/60 bg-white/90 p-8 shadow-xl shadow-amber-100/60 backdrop-blur">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
            Güvenli yönetici erişimi
          </p>
          <CardTitle className="text-2xl">Delivery Ops&apos;a Giriş Yap</CardTitle>
          <p className="text-sm text-slate-600">
            <code>admin</code> veya <code>dispatcher</code> rolüne sahip Firebase Auth hesabıyla giriş yapın.
          </p>
        </div>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            label="E-posta"
            error={form.formState.errors.email?.message}
          >
            <TextInput
              type="email"
              autoComplete="email"
              placeholder="ops@example.com"
              {...form.register("email")}
            />
          </FormField>
          <FormField
            label="Şifre"
            error={form.formState.errors.password?.message}
          >
            <TextInput
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...form.register("password")}
            />
          </FormField>
          {errorMessage ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Giriş yapılıyor..." : "Giriş yap"}
          </Button>
        </form>
      </div>
    </Card>
  );
}
