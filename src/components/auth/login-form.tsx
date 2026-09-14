"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: data.get("username"), password: data.get("password"), remember: data.get("remember") === "on" }) });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { message?: string; code?: string };
        console.error("FleetGuard login request failed", {
          status: response.status,
          statusText: response.statusText,
          code: result.code ?? "AUTH_REQUEST_FAILED",
        });
        setError(result.message ?? "Unable to sign in. Please try again.");
        return;
      }
      router.replace("/dashboard");
    } catch { setError("Unable to sign in. Please try again."); }
    finally { setLoading(false); }
  }

  return <form onSubmit={submit} className="mt-8 space-y-5">
    <div><label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">Email address</label><Input id="username" name="username" type="email" placeholder="Enter email address" autoComplete="email" required autoFocus/></div>
    <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label><a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Forgot password?</a></div><div className="relative"><Input id="password" name="password" type={visible ? "text" : "password"} placeholder="Enter password" autoComplete="current-password" required className="pr-11"/><button type="button" onClick={() => setVisible(!visible)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-700" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></div>
    <label className="flex w-fit items-center gap-2 text-sm text-slate-600"><input name="remember" type="checkbox" className="size-4 rounded border-slate-300 accent-blue-600"/>Remember me</label>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>}
    <Button type="submit" className="w-full" disabled={loading}>{loading ? <><LoaderCircle className="mr-2 animate-spin" size={17}/>Signing in…</> : "Login"}</Button>
  </form>;
}
