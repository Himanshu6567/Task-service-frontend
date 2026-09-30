"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Mail,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "../next-router";
import { getSession } from "../../lib/auth-client";

const STATUS_STYLES = {
  ReqPending: "bg-amber-50 text-amber-800 ring-amber-200",
  Pending: "bg-sky-50 text-sky-800 ring-sky-200",
  Accepted: "bg-sky-50 text-sky-800 ring-sky-200",
  Completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Rejected: "bg-rose-50 text-rose-800 ring-rose-200",
};

const STATUS_LABELS = {
  ReqPending: "Awaiting provider",
  Pending: "Accepted",
  Accepted: "Accepted",
  Completed: "Completed",
  Rejected: "Declined",
};

function formatDate(dateValue) {
  if (!dateValue) return "Date not set";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(dateValue));
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSession()
      .then((session) => {
        if (session.role !== "user") throw new Error("User session required");
        return axios.get("/api/services/myBookings");
      })
      .then((response) => setBookings(response.data))
      .catch((requestError) => {
        console.error("Unable to load bookings", requestError);
        setError("We could not load your bookings. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <main className="min-h-screen bg-[#f5f8f4] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Customer account
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              My bookings
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Check request progress and keep your provider’s contact details
              handy.
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#123f35] px-4 text-sm font-semibold text-white transition hover:bg-[#0c3028]"
          >
            Find another service <ArrowRight size={16} />
          </Link>
        </header>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
          >
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Search size={34} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              No bookings yet
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your service requests and their status will appear here.
            </p>
            <Link
              to="/services"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              Browse services <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-500">
              {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
            </p>
            {bookings.map((booking) => {
              const statusClass =
                STATUS_STYLES[booking.status] ||
                "bg-slate-100 text-slate-700 ring-slate-200";
              const statusLabel =
                STATUS_LABELS[booking.status] || booking.status;
              return (
                <article
                  key={booking._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-900">
                          {booking.serviceTitle}
                        </h2>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        {booking.serviceDescription}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays
                            size={14}
                            className="text-emerald-700"
                          />
                          {formatDate(booking.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} className="text-emerald-700" />
                          {booking.time || "Time not set"}
                        </span>
                      </div>
                    </div>
                    <div className="w-full rounded-xl border border-slate-100 bg-[#f8faf8] p-4 lg:max-w-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                        Service provider
                      </p>
                      {booking.provider ? (
                        <>
                          <div className="flex items-center gap-3">
                            <img
                              src={booking.provider.image || "/image/logo.png"}
                              alt=""
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {booking.provider.name}
                              </p>
                              <p className="mt-0.5 text-xs capitalize text-slate-500">
                                {booking.provider.jobCategory}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-xs text-slate-600">
                            <p className="flex items-center gap-2">
                              <ShieldCheck
                                size={14}
                                className="shrink-0 text-emerald-700"
                              />
                              Provider details
                            </p>
                            {booking.provider.mobile && (
                              <a
                                href={`tel:${booking.provider.mobile}`}
                                className="flex items-center gap-2 hover:text-emerald-800"
                              >
                                <Phone
                                  size={14}
                                  className="shrink-0 text-emerald-700"
                                />
                                {booking.provider.mobile}
                              </a>
                            )}
                            {booking.provider.email && (
                              <a
                                href={`mailto:${booking.provider.email}`}
                                className="flex min-w-0 items-center gap-2 hover:text-emerald-800"
                              >
                                <Mail
                                  size={14}
                                  className="shrink-0 text-emerald-700"
                                />
                                <span className="truncate">
                                  {booking.provider.email}
                                </span>
                              </a>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Provider details are unavailable.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
