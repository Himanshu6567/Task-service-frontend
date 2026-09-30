"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPinned,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "../next-router";
import { useMessage } from "../providers";

const RESEND_WAIT_SECONDS = 60;

export default function Page() {
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const [data, setData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [signupPayload, setSignupPayload] = useState(null);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(
      () => setCountdown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [countdown]);

  const update = (event) =>
    setData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

  const sendOtpRequest = async (payload, isResend = false) => {
    const response = await axios.post("/api/signup/send-otp", payload, {
      headers: { "Content-Type": "application/json" },
    });

    setSignupPayload({
      email: payload.email,
      password: payload.password,
      name: payload.name,
      mobile: payload.mobile,
      role: payload.role,
    });
    setOtpSent(true);
    setOtp("");
    setCountdown(RESEND_WAIT_SECONDS);
    showMessage(
      "success",
      response.data.msg || "Verification code sent to your email.",
    );
    if (isResend) {
      showMessage("success", "A new verification code has been sent.");
    }
    return response;
  };

  const submit = async (event) => {
    event.preventDefault();
    const { name, email, mobile, password, confirmPassword } = data;

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return showMessage("error", "Please enter a valid email address.");
    }
    if (password.length < 8) {
      return showMessage(
        "error",
        "Password must be at least 8 characters long.",
      );
    }
    if (password !== confirmPassword) {
      return showMessage("error", "Passwords do not match.");
    }
    if (!role) return showMessage("error", "Please select the user role.");

    try {
      setIsSubmitting(true);
      await sendOtpRequest({
        name,
        email: email.trim().toLowerCase(),
        mobile,
        password,
        role,
      });
    } catch (error) {
      const message =
        error.response?.data?.msg || "Unable to send the verification code.";
      showMessage("error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!signupPayload || otp.length !== 6) {
      return showMessage("error", "Enter the 6-digit verification code.");
    }

    try {
      setIsVerifying(true);
      const response = await axios.post(
        "/api/signup/verify-otp",
        { email: signupPayload.email, otp },
        { headers: { "Content-Type": "application/json" } },
      );

      showMessage("success", response.data.msg || "Email verified.");
      if (signupPayload.role === "serviceProvider") {
        navigate("/register", {
          state: {
            email: signupPayload.email,
            password: signupPayload.password,
            name: signupPayload.name,
            mobile: signupPayload.mobile,
            role: "serviceProvider",
          },
        });
        return;
      }

      navigate("/login");
    } catch (error) {
      const message = error.response?.data?.msg || "Unable to verify the OTP.";
      showMessage("error", message);
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (!signupPayload || countdown > 0) return;

    try {
      await sendOtpRequest(
        {
          name: signupPayload.name,
          email: signupPayload.email,
          mobile: signupPayload.mobile,
          password: signupPayload.password,
          role: signupPayload.role,
        },
        true,
      );
    } catch (error) {
      const message = error.response?.data?.msg || "Unable to resend the code.";
      showMessage("error", message);
    }
  };

  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-[#f4f7f5] px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,61,46,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="order-2 p-6 sm:p-10 lg:order-1 lg:p-14">
          <div className="mb-8 flex items-center gap-3 text-[#123f35] lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300">
              <MapPinned size={21} />
            </span>
            <span className="text-lg font-semibold">UrbanAssist</span>
          </div>
          <div className="max-w-lg">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Get started
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {otpSent ? "Verify your email" : "Build your local network"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {otpSent
                ? "We sent a one-time code to your email so your account stays secure."
                : "Create an account to find trusted help or grow your service business."}
            </p>

            {otpSent ? (
              <div className="mt-8 space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="text-emerald-700" size={18} />
                    <span>{signupPayload?.email}</span>
                  </div>
                </div>

                <label className="block text-sm font-semibold text-slate-700">
                  Enter 6-digit code
                  <input
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-lg font-semibold tracking-[0.45rem] outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="------"
                  />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={otp.length !== 6 || isVerifying}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#123f35] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isVerifying ? "Verifying..." : "Verify & continue"}
                    <ArrowRight size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setSignupPayload(null);
                    }}
                    className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                  >
                    Edit details
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Code expires in 10 minutes
                  </span>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={countdown > 0}
                    className="font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                  </button>
                </div>
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={submit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Full name
                    <span className="relative mt-2 block">
                      <UserRound
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                        type="text"
                        name="name"
                        placeholder="Your name"
                        value={data.name}
                        onChange={update}
                        required
                      />
                    </span>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Mobile number
                    <span className="relative mt-2 block">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                        type="tel"
                        name="mobile"
                        placeholder="+91 98765 43210"
                        value={data.mobile}
                        onChange={update}
                        required
                      />
                    </span>
                  </label>
                </div>

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
                      value={data.email}
                      onChange={update}
                      required
                    />
                  </span>
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  {["password", "confirmPassword"].map((name) => (
                    <label
                      className="block text-sm font-semibold text-slate-700"
                      key={name}
                    >
                      {name === "password" ? "Password" : "Confirm password"}
                      <span className="relative mt-2 block">
                        <LockKeyhole
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          size={18}
                        />
                        <input
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-12 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                          type={showPassword ? "text" : "password"}
                          name={name}
                          placeholder={
                            name === "password"
                              ? "At least 8 characters"
                              : "Repeat your password"
                          }
                          value={data[name]}
                          onChange={update}
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
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </span>
                    </label>
                  ))}
                </div>

                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-slate-700">
                    How will you use UrbanAssist?
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${role === "user" ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/10" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={role === "user"}
                        onChange={(event) => setRole(event.target.value)}
                        required
                        className="accent-emerald-700"
                      />
                      <UserRound size={17} />
                      Find a service
                      {role === "user" && (
                        <Check size={16} className="ml-auto text-emerald-700" />
                      )}
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${role === "serviceProvider" ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/10" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="serviceProvider"
                        checked={role === "serviceProvider"}
                        onChange={(event) => setRole(event.target.value)}
                        className="accent-emerald-700"
                      />
                      <BriefcaseBusiness size={17} />
                      Offer a service
                      {role === "serviceProvider" && (
                        <Check size={16} className="ml-auto text-emerald-700" />
                      )}
                    </label>
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123f35] text-sm font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-[#0c3028] focus:outline-none focus:ring-4 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? "Sending code..." : "Send OTP code"}
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-emerald-700 transition hover:text-emerald-900"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>

        <section className="relative order-1 hidden min-h-[680px] overflow-hidden bg-[#123f35] p-10 text-white lg:order-2 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full border-[30px] border-amber-200/10" />
          <div className="absolute -left-16 top-28 h-52 w-52 rounded-full border-[22px] border-emerald-300/10" />
          <div className="relative">
            <div className="mb-16 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-[#123f35]">
                <MapPinned size={21} strokeWidth={2.5} />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                UrbanAssist
              </span>
            </div>
            <h2 className="max-w-xs text-4xl font-semibold leading-[1.08] tracking-tight">
              One account. More ways to thrive locally.
            </h2>
            <div className="mt-10 space-y-5 text-sm text-emerald-50/80">
              {[
                "Discover reliable neighborhood professionals",
                "Manage requests in one simple place",
                "Grow your reach as a service provider",
              ].map((item) => (
                <div className="flex items-start gap-3" key={item}>
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/20 text-amber-300">
                    <Check size={13} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-sm leading-6 text-emerald-50/65">
            A more helpful neighborhood starts with a single connection.
          </p>
        </section>
      </div>
    </main>
  );
}
