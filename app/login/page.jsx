"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPinned,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "../next-router";
import { useMessage } from "../providers";
import { getSession } from "../../lib/auth-client";

export default function Page() {
  const [error, setError] = useState("");
  const [userDetails, setUserDetails] = useState({
    email: "",
    password: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { showMessage } = useMessage();

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
    setError("");
  };
  const handleLogIn = async (e) => {
    e.preventDefault();
    const { role } = userDetails;
    if (!role) {
      setError("All fields are required");
      return;
    }
    const url =
      role == "user"
        ? "/api/user/loginUser"
        : "/api/serviceProvider/logInServiceProvider";
    try {
      const response = await axios.post(url, userDetails, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.status == 201) {
        await getSession();
        showMessage("success", "Login Successful");
        window.location.assign("/");
      }
    } catch (err) {
      if (err.response && err.response.status == 401)
        showMessage("error", "Invalid email or password");
      else {
        console.error("Something went wrong!", err);
        showMessage("error", "Something went wrong");
      }
    }
  };
  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-[#f4f7f5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,61,46,0.35)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden min-h-[620px] overflow-hidden bg-[#123f35] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 top-20 h-64 w-64 rounded-full border-[26px] border-emerald-300/10" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border-[38px] border-amber-200/10" />
          <div className="relative">
            <div className="mb-16 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-[#123f35]">
                <MapPinned size={21} strokeWidth={2.5} />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                UrbanAssist
              </span>
            </div>
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.22em] text-emerald-200">
              Your neighborhood, connected
            </p>
            <h1 className="max-w-sm text-4xl font-semibold leading-[1.08] tracking-tight">
              Good help is closer than you think.
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-6 text-emerald-50/75">
              Find trusted local professionals or bring your own skills to the
              people who need them.
            </p>
          </div>
          <div className="relative flex items-center gap-3 text-sm text-emerald-50/80">
            <ShieldCheck size={18} className="text-amber-300" />
            Secure access for your account
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-14">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3 text-[#123f35]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300">
                <MapPinned size={21} />
              </span>
              <span className="text-lg font-semibold">UrbanAssist</span>
            </div>
          </div>
          <div className="max-w-md">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Welcome back
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Sign in to continue
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Access your bookings, messages, and local service network.
            </p>

            {error && (
              <div
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            <form
              className="mt-8 space-y-5"
              method="post"
              action="/login"
              onSubmit={handleLogIn}
            >
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-slate-700">
                  I am signing in as
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${userDetails.role === "user" ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/10" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={userDetails.role === "user"}
                      onChange={handleInputChange}
                      className="accent-emerald-700"
                    />
                    <UserRound size={17} />
                    User
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${userDetails.role === "serviceProvider" ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/10" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="serviceProvider"
                      checked={userDetails.role === "serviceProvider"}
                      onChange={handleInputChange}
                      className="accent-emerald-700"
                    />
                    <BriefcaseBusiness size={17} />
                    Provider
                  </label>
                </div>
              </fieldset>

              <label className="block text-sm font-semibold text-slate-700">
                Email address
                <span className="relative mt-2 block">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    onChange={handleInputChange}
                    required
                  />
                </span>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Password
                <span className="relative mt-2 block">
                  <LockKeyhole
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-12 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123f35] text-sm font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-[#0c3028] focus:outline-none focus:ring-4 focus:ring-emerald-600/20"
              >
                Sign in
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-emerald-700 transition hover:text-emerald-900"
              >
                Create one
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
