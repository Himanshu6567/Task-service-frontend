"use client";

import axios from "axios";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  MapPin,
  MessageCircle,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { useNavigate } from "../next-router";
import { useMessage, useSocket } from "../providers";
import { getSession } from "../../lib/auth-client";

const SERVICE_CATEGORIES = [
  { value: "teacher", label: "Teacher" },
  { value: "babysitter", label: "Babysitter" },
  { value: "makeup artist", label: "Makeup Artist" },
  { value: "driver", label: "Driver" },
];

function getCategoryFromQuery(query) {
  const value = query.toLowerCase();
  if (value.includes("makeup") || value.includes("make up")) {
    return "makeup artist";
  }
  return (
    SERVICE_CATEGORIES.find(
      (category) =>
        category.label.toLowerCase() === value || category.value === value,
    )?.value || "all"
  );
}

function filterProviders(providers, filters) {
  const allowedProviders = providers.filter((provider) =>
    SERVICE_CATEGORIES.some(
      (category) => category.value === provider.jobCategory?.toLowerCase(),
    ),
  );
  const categoryMatches =
    filters.services === "all"
      ? allowedProviders
      : allowedProviders.filter(
          (provider) => provider.jobCategory.toLowerCase() === filters.services,
        );

  return [...categoryMatches].sort((a, b) => {
    if (filters.sortBy === "Price Low") return a.salary - b.salary;
    if (filters.sortBy === "Price High") return b.salary - a.salary;
    if (filters.sortBy === "Rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });
}

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

function UserRoute({ children }) {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    getSession()
      .then((session) => {
        if (session.role === "user") setAuthenticated(true);
        else navigate("/");
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  return authenticated === null ? <LoadingState /> : children;
}

UserRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function LoadingState() {
  return (
    <div className="flex min-h-[600px] items-center justify-center bg-[#f5f8f4]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
    </div>
  );
}

function ServiceForm({ serviceProviderId, onCancel }) {
  const { showMessage } = useMessage();
  const socket = useSocket();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    ProviderID: serviceProviderId,
  });
  const [error, setError] = useState("");
  const [btnText, setBtnText] = useState("Send request");
  const currentTime = new Date();
  const minimumDate = new Date(
    currentTime.getTime() - currentTime.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 10);
  const minimumTime = currentTime.toTimeString().slice(0, 5);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBtnText("Sending...");
    if (
      !formData.title ||
      !formData.description ||
      !formData.date ||
      !formData.time
    ) {
      setError("Complete every field before sending your request.");
      setBtnText("Send request");
      return;
    }
    if (new Date(`${formData.date}T${formData.time}`).getTime() <= Date.now()) {
      setError("Choose a future date and time for your booking.");
      setBtnText("Send request");
      return;
    }
    if (new Date(`${formData.date}T${formData.time}`).getTime() <= Date.now()) {
      setError("Choose a future date and time for your booking.");
      setBtnText("Send request");
      return;
    }

    try {
      const response = await axios.post("/api/services/NewService", formData, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.status === 201) {
        socket?.emit("newRequest", {
          ProviderID: serviceProviderId,
          task: response.data.task,
        });
        showMessage("success", "Request sent successfully");
        onCancel();
      }
    } catch (requestError) {
      console.error("Unable to send service request", requestError);
      showMessage("Error", "Unable to send service request");
    } finally {
      setBtnText("Send request");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="relative my-auto w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close booking form"
        >
          <X size={20} />
        </button>
        <div className="mb-7 pr-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Book a provider
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Tell them what you need
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Share a few details so the provider can respond with confidence.
          </p>
        </div>
        {error && (
          <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700">
            Service title
            <input
              type="text"
              name="title"
              placeholder="What do you need help with?"
              value={formData.title}
              onChange={handleChange}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              required
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Description
            <textarea
              name="description"
              placeholder="Add useful details about the request"
              value={formData.description}
              onChange={handleChange}
              className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Date
              <span className="relative mt-2 block">
                <CalendarDays
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  type="date"
                  name="date"
                  min={minimumDate}
                  value={formData.date}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  required
                />
              </span>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Time
              <input
                type="time"
                name="time"
                min={formData.date === minimumDate ? minimumTime : undefined}
                value={formData.time}
                onChange={handleChange}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                required
              />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded-xl px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#123f35] px-5 text-sm font-semibold text-white transition hover:bg-[#0c3028]"
            >
              {btnText}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ServiceForm.propTypes = {
  serviceProviderId: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
};

function ProviderChat({ provider, onClose }) {
  const socket = useSocket();
  const { showMessage } = useMessage();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    getSession()
      .then((session) => setUserId(String(session.userId || "")))
      .catch(() => {});
    axios
      .get(`/api/sendMessage/chat/${provider._id}`)
      .then((response) => setMessages(response.data))
      .catch((error) => {
        console.error("Unable to load chat messages", error);
        showMessage("error", "Unable to load this conversation");
      })
      .finally(() => setLoading(false));
  }, [provider._id, showMessage]);

  useEffect(() => {
    if (!socket) return undefined;
    const handleChatMessage = (event) => {
      if (
        event.providerId === provider._id &&
        event.userId === userId &&
        !messages.some((message) => message._id === event.message._id)
      ) {
        setMessages((previous) => [...previous, event.message]);
      }
    };
    socket.on("chatMessage", handleChatMessage);
    return () => socket.off("chatMessage", handleChatMessage);
  }, [socket, provider._id, userId, messages]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      const response = await axios.post(
        "/api/sendMessage/chat",
        { providerId: provider._id, message },
        {},
      );
      socket?.emit("chatMessage", {
        providerId: provider._id,
        userId,
        message: response.data,
      });
      setMessages((previous) =>
        previous.some((item) => item._id === response.data._id)
          ? previous
          : [...previous, response.data],
      );
      setDraft("");
    } catch (error) {
      const requestId =
        error.response?.headers?.["x-request-id"] ||
        error.response?.data?.requestId;
      console.error(
        "Unable to send chat message",
        JSON.stringify({
          status: error.response?.status,
          code: error.code,
          requestId,
          message: error.response?.data?.msg || error.message,
        }),
      );
      showMessage(
        "error",
        error.response?.data?.msg || "Unable to send your message",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section className="flex h-[min(700px,92dvh)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[min(700px,85dvh)] sm:rounded-3xl">
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <img
            src={provider.image}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-slate-900">
              Chat with {provider.name}
            </h2>
            <p className="text-xs capitalize text-slate-500">
              {provider.jobCategory}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7faf8] px-4 py-5 sm:px-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading conversation…
            </p>
          ) : messages.length === 0 ? (
            <div className="mx-auto mt-10 max-w-xs text-center">
              <MessageCircle size={28} className="mx-auto text-emerald-700" />
              <p className="mt-3 font-semibold text-slate-800">
                Start a conversation
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Ask about availability, pricing, or the service you need.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const ownMessage = message.senderId?.toString() === userId;
              return (
                <div
                  key={message._id}
                  className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${ownMessage ? "rounded-br-md bg-[#123f35] text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-700"}`}
                  >
                    {message.message}
                    <span
                      className={`mt-1 block text-[10px] ${ownMessage ? "text-emerald-100/70" : "text-slate-400"}`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
              );
            })
          )}
        </div>
        <form
          onSubmit={sendMessage}
          className="flex items-end gap-2 border-t border-slate-100 p-3 sm:p-4"
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={1}
            maxLength={2000}
            placeholder="Write a message…"
            className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
            aria-label="Message"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#123f35] text-white transition hover:bg-[#0c3028] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={17} />
          </button>
        </form>
      </section>
    </div>
  );
}

ProviderChat.propTypes = {
  provider: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    image: PropTypes.string,
    name: PropTypes.string.isRequired,
    jobCategory: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

function Services() {
  const [serviceProviders, setServiceProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    services: "all",
    sortBy: "Recommended",
  });
  const [chatProvider, setChatProvider] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/serviceProvider/getAllProvider")
      .then((response) => {
        if (response.status === 200) {
          const providers = response.data.alluser;
          const query = new URLSearchParams(window.location.search).get(
            "service",
          );
          const selectedCategory = query ? getCategoryFromQuery(query) : "all";
          const nextFilters = {
            services: selectedCategory,
            sortBy: "Recommended",
          };
          setServiceProviders(providers);
          setFilters(nextFilters);
          setFilteredProviders(filterProviders(providers, nextFilters));
        }
      })
      .catch((error) =>
        console.error("Unable to fetch service providers", error),
      )
      .finally(() => setLoading(false));
  }, []);

  const updateFilter = (event) => {
    const nextFilters = { ...filters, [event.target.name]: event.target.value };
    setFilters(nextFilters);
    setFilteredProviders(filterProviders(serviceProviders, nextFilters));
  };

  const resetFilters = () => {
    const nextFilters = { services: "all", sortBy: "Recommended" };
    setFilters(nextFilters);
    setFilteredProviders(filterProviders(serviceProviders, nextFilters));
  };

  if (loading) return <LoadingState />;

  return (
    <main className="min-h-screen bg-[#f5f8f4] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#123f35] px-6 py-10 text-white shadow-xl shadow-emerald-950/10 sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[28px] border-emerald-200/10" />
          <div className="relative max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
              <BriefcaseBusiness size={14} className="text-amber-300" /> Local
              professionals
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Find the right help for the job.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50/75 sm:text-base">
              Browse trusted providers, compare their services, and send a
              request when you find the right fit.
            </p>
            <div className="mt-7 flex flex-wrap gap-5 text-sm text-emerald-50/80">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-300" />
                Trusted providers
              </span>
              <span className="inline-flex items-center gap-2">
                <Check size={16} className="text-amber-300" />
                No location filtering
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/5 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_0.7fr_auto] md:items-end">
            <label className="block text-sm font-semibold text-slate-700">
              Service category
              <span className="relative mt-2 block">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <select
                  name="services"
                  value={filters.services}
                  onChange={updateFilter}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                >
                  <option value="all">All four categories</option>
                  {SERVICE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
              </span>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Sort providers
              <span className="relative mt-2 block">
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={updateFilter}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                >
                  <option>Recommended</option>
                  <option>Rating</option>
                  <option>Price Low</option>
                  <option>Price High</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
              </span>
            </label>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </section>

        <div className="mb-6 mt-12 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Available now
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {filters.services === "all"
                ? "Service providers"
                : `${filters.services} providers`}
            </h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            {filteredProviders.length} results
          </span>
        </div>
        {filteredProviders.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProviders.map((provider) => (
              <article
                key={provider._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/10"
              >
                <div className="relative h-52 overflow-hidden bg-emerald-50">
                  <img
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    src={provider.image}
                    alt={provider.name}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-800 backdrop-blur">
                    {provider.jobCategory}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {provider.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin size={14} className="text-emerald-700" />
                        Available for local requests
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                      <Star size={15} fill="currentColor" />
                      {provider.rating || "4.8"}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">
                    {provider.aboutYou}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {provider.workDescription}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <CircleDollarSign
                        size={16}
                        className="text-emerald-700"
                      />
                      ₹{provider.salary} / service
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatProvider(provider)}
                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                  >
                    <MessageCircle size={16} />
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(provider._id);
                      setShowForm(true);
                    }}
                    className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#123f35] text-sm font-semibold text-white transition hover:bg-[#0c3028]"
                  >
                    Book this provider <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Search className="mx-auto text-slate-300" size={38} />
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              No providers found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Try another service category or reset the filters.
            </p>
          </div>
        )}
      </div>
      {showForm && (
        <ServiceForm
          serviceProviderId={selectedServiceId}
          onCancel={() => {
            setShowForm(false);
            setSelectedServiceId(null);
          }}
        />
      )}
      {chatProvider && (
        <ProviderChat
          provider={chatProvider}
          onClose={() => setChatProvider(null)}
        />
      )}
    </main>
  );
}

export default function Page() {
  return (
    <AuthRoute>
      <UserRoute>
        <Services />
      </UserRoute>
    </AuthRoute>
  );
}
