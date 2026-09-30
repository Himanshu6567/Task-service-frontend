"use client";

import axios from "axios";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Handshake,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "./next-router";
import { useMessage } from "./providers";
import ProviderDashboard from "./components/ProviderDashboard";
import { getSession } from "../lib/auth-client";

function AuthRoute({ children }) {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(null);
  useEffect(() => {
    getSession()
      .then(() => setAuthenticated(true))
      .catch(() => navigate("/login"));
  }, [navigate]);
  return authenticated === null ? null : children;
}

AuthRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#f5f8f4] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 left-1/3 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 shadow-sm">
            <Sparkles size={14} className="text-amber-500" />
            Local help, made simple
          </div>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#123f35] sm:text-5xl lg:text-6xl">
            Your neighborhood has more to offer.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
            Find trusted professionals for the things that matter, or share your
            own skills with people nearby.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/services"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#123f35] px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-[#0c3028]"
            >
              Explore services
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              Join UrbanAssist
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700" />
              Verified local providers
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-700" />
              Simple, secure access
            </span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -left-5 top-8 z-10 hidden rounded-2xl border border-white bg-white p-4 shadow-xl shadow-emerald-950/10 sm:block">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <Users size={19} />
              </span>
              <div>
                <p className="text-xs text-slate-500">Community network</p>
                <p className="text-sm font-bold text-slate-900">
                  100+ happy users
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border-8 border-white bg-emerald-100 shadow-[0_28px_70px_-30px_rgba(15,61,46,0.4)]">
            <img
              className="aspect-[4/3] w-full object-cover"
              src="/image/2.png"
              alt="People finding local services"
            />
          </div>
          <div className="absolute -bottom-5 right-5 rounded-2xl bg-[#123f35] px-5 py-4 text-white shadow-xl shadow-emerald-950/20 sm:right-10">
            <div className="flex items-center gap-2 text-amber-300">
              <MapPin size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Right nearby
              </span>
            </div>
            <p className="mt-1 text-sm text-emerald-50/80">
              Great service starts local.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function OurServices() {
  const [serviceData, setServiceData] = useState([]);
  const [bookbtn, setBookbtn] = useState(false);
  useEffect(() => {
    getSession()
      .then((session) => {
        if (session.role === "ServiceProvider") setBookbtn(true);
      })
      .catch(() => {});
    axios
      .get("/api/initialService")
      .then((response) => {
        if (response.status === 201) setServiceData(response.data);
      })
      .catch((error) =>
        console.error("enable to fatch initial services", error),
      );
  }, []);
  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              What can we help with?
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Popular local services
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Explore trusted help from people who know your neighborhood.
            </p>
          </div>
          <Link
            to="/services"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
          >
            View all services{" "}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {serviceData.map((service, index) => (
            <div
              key={index}
              className="group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/10"
            >
              <Link
                to={`/services?service=${encodeURIComponent(service.title)}`}
                className="block overflow-hidden"
                aria-label={`Find providers for ${service.title}`}
              >
                <img
                  className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                  src={service.photo}
                  alt={service.title}
                />
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <Link
                  to={`/services?service=${encodeURIComponent(service.title)}`}
                  className="mb-2 text-lg font-semibold text-slate-900 transition hover:text-emerald-800"
                >
                  {service.title}
                </Link>
                <p className="mb-5 flex-1 text-sm leading-6 text-slate-500">
                  {service.discription}
                </p>
                {bookbtn ? (
                  <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-400">
                    Providers can’t book services
                  </span>
                ) : (
                  <Link
                    to={`/services?service=${encodeURIComponent(service.title)}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-800 hover:text-white"
                  >
                    Find a provider <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: MapPin,
      title: "Choose what you need",
      text: "Browse practical services from people working in and around your neighborhood.",
    },
    {
      number: "02",
      icon: CalendarCheck2,
      title: "Send a request",
      text: "Share the date, time, and details so the right provider can understand the job.",
    },
    {
      number: "03",
      icon: Handshake,
      title: "Get it sorted",
      text: "Keep the conversation in one place and follow your request through to completion.",
    },
  ];

  return (
    <section className="bg-[#f5f8f4] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="relative overflow-hidden rounded-[2rem] border-8 border-white bg-emerald-100 shadow-[0_28px_70px_-30px_rgba(15,61,46,0.4)]">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85"
            alt="People collaborating on a local service"
            className="aspect-[4/3] h-full w-full object-cover"
          />
          <div className="absolute bottom-5 left-5 max-w-[calc(100%-2.5rem)] rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:left-7 sm:bottom-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              One local network
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Help that feels closer to home.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            A simpler way to get help
          </p>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            From small tasks to trusted local support.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            UrbanAssist keeps discovery, booking, and communication together so
            you can spend less time searching and more time getting things done.
          </p>
          <div className="mt-8 space-y-5">
            {steps.map(({ number, icon: Icon, title, text }) => (
              <div key={number} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#123f35] text-sm font-bold text-amber-300">
                  {number}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <Icon size={17} className="text-emerald-700" />
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunitySection() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] bg-[#123f35] p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-[#123f35]">
            <ShieldCheck size={23} />
          </div>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">
            Built around trust
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
            A better way for neighbors to support one another.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-emerald-50/75 sm:text-base">
            Customers can find dependable help nearby, while skilled providers
            get a clear place to share their work and build lasting connections.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Local first", "Find people serving your area."],
              ["Clear requests", "Share the details up front."],
              ["Open dialogue", "Keep messages easy to follow."],
            ].map(([title, text]) => (
              <div key={title} className="border-t border-white/15 pt-4">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-100/60">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-[#f8faf8] p-7 sm:p-10">
          <div>
            <img
              src="/image/logo.png"
              alt="UrbanAssist"
              className="h-16 w-16 rounded-2xl object-cover"
            />
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Have a skill to share?
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Turn your experience into local opportunity.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Create a provider profile and let nearby customers discover what
              you do best.
            </p>
          </div>
          <Link
            to="/signup"
            className="group mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#123f35] px-5 text-sm font-semibold text-white transition hover:bg-[#0c3028]"
          >
            Join as a provider{" "}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeedbackSection() {
  const [feedbackData, setFeedbackData] = useState([]);
  useEffect(() => {
    axios
      .get("/api/Feedbacks")
      .then((response) => {
        if (response.status === 201) setFeedbackData(response.data);
      })
      .catch((error) =>
        console.error("enable to fatch initial services", error),
      );
  }, []);
  return (
    <section className="bg-[#f5f8f4] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Community voices
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Good work gets noticed
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Real experiences from people making everyday life a little easier.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {feedbackData.map((feedback, index) => (
            <article
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={feedback.photo}
                    alt={feedback.name}
                    className="h-11 w-11 rounded-full object-cover ring-4 ring-emerald-50"
                  />
                  <h3 className="text-sm font-semibold text-slate-900">
                    {feedback.name}
                  </h3>
                </div>
                <div
                  className="flex gap-0.5"
                  aria-label={`${feedback.rating} out of 5 stars`}
                >
                  {Array.from({ length: feedback.rating }, (_, i) => (
                    <Star
                      key={i}
                      size={15}
                      fill="currentColor"
                      className="text-amber-400"
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm leading-7 text-slate-600">
                “{feedback.feedback}”
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GetInTouch() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });
  const [btnText, setBtnText] = useState("Submit");
  const { showMessage } = useMessage();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setBtnText("Submitting...");
    try {
      const response = await axios.post("/api/sendMessage", formData, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.status == 201) {
        showMessage("success", "message  send successfully");
        setFormData({ fullName: "", email: "", message: "" });
      }
    } catch (err) {
      showMessage("Error", "enable to send message");
      console.log("enable to send message", err);
    } finally {
      setBtnText("Submit");
    }
  };
  return (
    <section className="bg-[#123f35] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative overflow-hidden p-7 sm:p-10 lg:p-12">
          <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full border-[28px] border-emerald-200/10" />
          <div className="relative">
            <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-[#123f35]">
              <MessageCircle size={23} />
            </span>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">
              We’re listening
            </p>
            <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Have something to share?
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-emerald-50/70">
              Questions, ideas, or feedback help us make UrbanAssist better for
              every neighborhood.
            </p>
            <div className="mt-10 space-y-4 text-sm text-emerald-50/80">
              <p className="flex items-center gap-3">
                <Mail size={17} className="text-amber-300" />
                support@services.com
              </p>
              <p className="flex items-center gap-3">
                <MapPin size={17} className="text-amber-300" />
                Dehradun, Uttarakhand
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 sm:p-10 lg:p-12">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
            Get in touch
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Send us a message and our team will get back to you.
          </p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              Full name
              <input
                required
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Your name"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Email address
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="you@example.com"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Message
              <textarea
                required
                name="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                rows="4"
                placeholder="How can we help?"
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>
            <button
              type="submit"
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123f35] text-sm font-semibold text-white transition hover:bg-[#0c3028] focus:outline-none focus:ring-4 focus:ring-emerald-600/20"
            >
              {btnText}
              <Send
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    getSession()
      .then((session) => setRole(session.role || ""))
      .catch(() => setRole(""));
  }, []);

  if (role === null) return null;
  if (role === "ServiceProvider") return <ProviderDashboard />;

  return (
    <AuthRoute>
      <div>
        <HeroSection />
        <OurServices />
        <HowItWorksSection />
        <CommunitySection />
        <FeedbackSection />
        <GetInTouch />
      </div>
    </AuthRoute>
  );
}
