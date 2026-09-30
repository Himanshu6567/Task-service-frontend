"use client";

import { Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";
import { Link } from "../next-router";

export default function Footer() {
  return (
    <footer className="border-t border-emerald-900/20 bg-[#123f35] text-emerald-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_0.8fr_1fr] md:py-16 lg:px-8">
        <div className="max-w-sm">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-3 text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-[#123f35]">
              <MapPin size={20} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              UrbanAssist
            </span>
          </Link>
          <p className="text-sm leading-6 text-emerald-100/70">
            Making everyday services easier to find, book, and deliver in your
            neighborhood.
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">
            Explore
          </h2>
          <nav className="flex flex-col items-start gap-3 text-sm text-emerald-100/75">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <Link to="/services" className="transition hover:text-white">
              Find services
            </Link>
            <Link to="/login" className="transition hover:text-white">
              Sign in
            </Link>
          </nav>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-amber-300">
            Contact
          </h2>
          <div className="space-y-3 text-sm text-emerald-100/75">
            <p className="flex items-start gap-3">
              <MapPin size={17} className="mt-0.5 shrink-0 text-amber-300" />
              123, Service Lane, Dehradun
            </p>
            <a
              href="mailto:support@services.com"
              className="flex items-center gap-3 transition hover:text-white"
            >
              <Mail size={17} className="shrink-0 text-amber-300" />
              support@services.com
            </a>
            <a
              href="tel:+919876543210"
              className="flex items-center gap-3 transition hover:text-white"
            >
              <Phone size={17} className="shrink-0 text-amber-300" />
              +91 9876543210
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-emerald-100/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>
            © {new Date().getFullYear()} UrbanAssist. All rights reserved.
          </span>
          <span className="inline-flex items-center gap-1">
            Built for better neighborhoods <ArrowUpRight size={13} />
          </span>
        </div>
      </div>
    </footer>
  );
}
