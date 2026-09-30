"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  LogIn,
  LogOut,
  MapPinned,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";
import { Link, useNavigate } from "../next-router";
import { getSession, logout } from "../../lib/auth-client";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getSession()
      .then((session) => {
        setIsLoggedIn(true);
        setRole(session.role || "");
      })
      .catch(() => {
        setIsLoggedIn(false);
        setRole("");
      });
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogOut = () => {
    closeMenu();
    logout().finally(() => navigate("/login"));
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group flex items-center gap-3"
          onClick={closeMenu}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123f35] text-amber-300 shadow-sm transition-transform group-hover:-rotate-3">
            <MapPinned size={21} strokeWidth={2.4} />
          </span>
          <span className="text-lg font-bold tracking-tight text-[#123f35] sm:text-xl">
            UrbanAssist
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 md:hidden"
          aria-controls="main-navigation"
          aria-expanded={isMenuOpen}
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav
          id="main-navigation"
          className={`${isMenuOpen ? "absolute left-4 right-4 top-[calc(100%+0.5rem)] block rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10" : "hidden"} md:static md:block md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
            {role !== "ServiceProvider" && (
              <>
                <Link
                  to="/"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  Home
                </Link>
                <Link
                  to="/services"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  Find services
                </Link>
              </>
            )}
            {role === "user" && (
              <>
                <Link
                  to="/my-bookings"
                  onClick={closeMenu}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <ClipboardList size={16} />
                  My bookings
                </Link>
                <Link
                  to="/my-messages"
                  onClick={closeMenu}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <MessageCircle size={16} />
                  Messages
                </Link>
              </>
            )}
            {role === "ServiceProvider" && (
              <Link
                to="/provider-messages"
                onClick={closeMenu}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                <MessageCircle size={16} />
                Messages
              </Link>
            )}
            <div className="my-1 h-px bg-slate-100 md:mx-2 md:my-0 md:h-6 md:w-px" />
            {!isLoggedIn ? (
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <LogIn size={16} />
                Sign in
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleLogOut}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut size={16} />
                Sign out
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
