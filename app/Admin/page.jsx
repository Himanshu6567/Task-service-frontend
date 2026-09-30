"use client";

import axios from "axios";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "../next-router";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await axios.post("/api/admin/login", {
        email,
        password,
      });
      navigate("/Admin/dashboard");
    } catch (requestError) {
      setError(
        requestError.response?.data?.msg || "Unable to sign in as admin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh)] items-center justify-center overflow-hidden bg-[#f5f8f4] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />
      <section className="relative w-full max-w-md rounded-3xl border border-white bg-white p-6 shadow-[0_24px_80px_-32px_rgba(15,61,46,0.32)] sm:p-9">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#123f35] text-amber-300">
          <ShieldCheck size={23} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Restricted access
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Admin sign in
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Sign in to manage UrbanAssist users, providers, bookings, and
          messages.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Admin email
            <span className="relative mt-2 block">
              <Mail
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                placeholder="Admin email"
              />
            </span>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <span className="relative mt-2 block">
              <LockKeyhole
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                placeholder="Password"
              />
            </span>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123f35] text-sm font-semibold text-white transition hover:bg-[#0c3028] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Continue to dashboard"}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-400">
          Authorized administrators only
        </p>
      </section>
    </main>
  );
}
