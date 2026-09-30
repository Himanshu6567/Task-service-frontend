"use client";

import axios from "axios";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  BriefcaseBusiness,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Search,
  ShieldCheck,
  Star,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate } from "../../next-router";
import { getSession, logout } from "../../../lib/auth-client";

const VIEWS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "providers", label: "Providers", icon: BriefcaseBusiness },
  { id: "requests", label: "Service leads", icon: ClipboardList },
  { id: "messages", label: "Messages", icon: MessageSquareText },
  { id: "catalog", label: "Service catalog", icon: Activity },
  { id: "feedback", label: "Feedback", icon: Star },
  { id: "activity", label: "Activity log", icon: History },
];

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

function StatusBadge({ status }) {
  const style =
    status === "ReqPending"
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : status === "Pending" || status === "Accepted"
        ? "bg-sky-50 text-sky-800 ring-sky-200"
        : status === "Completed"
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
          : "bg-rose-50 text-rose-800 ring-rose-200";
  const label = status === "ReqPending" ? "New lead" : status;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {label || "Unknown"}
    </span>
  );
}
StatusBadge.propTypes = {
  status: PropTypes.string,
};

function DataTable({ columns, rows, emptyText }) {
  if (!rows.length)
    return (
      <div className="px-5 py-14 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.label} className="px-5 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr
              key={row._id || row.id || index}
              className="align-top hover:bg-slate-50/70"
            >
              {columns.map((column) => (
                <td
                  key={column.label}
                  className="max-w-sm px-5 py-4 text-slate-700"
                >
                  {column.render ? column.render(row) : row[column.key] || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      key: PropTypes.string,
      render: PropTypes.func,
    }),
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  emptyText: PropTypes.string.isRequired,
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSession()
      .then((session) => {
        if (session.role !== "admin") throw new Error("Admin session required");
        return axios.get("/api/admin/dashboard");
      })
      .then((response) => setData(response.data))
      .catch((requestError) => {
        setError(
          requestError.response?.data?.msg ||
            "Admin session expired. Sign in again.",
        );
        navigate("/Admin");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const signOut = () => {
    logout().finally(() => navigate("/Admin"));
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get("/api/admin/dashboard");
      setData(response.data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.msg || "Unable to refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  };

  const filterRows = useCallback(
    (rows, values) => {
      const query = search.trim().toLowerCase();
      if (!query) return rows;
      return rows.filter((row) =>
        values(row).some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        ),
      );
    },
    [search],
  );

  const handleDeleteAccount = async (type, item) => {
    if (!item?._id) return;
    const targetLabel = type === "user" ? "user" : "service provider";
    const confirmed = window.confirm(
      `Delete this ${targetLabel}? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      const response = await axios.delete(
        `/api/admin/${type === "user" ? "delete-user" : "delete-provider"}/${item._id}`,
      );

      setData((current) => {
        if (!current) return current;
        const key = type === "user" ? "users" : "providers";
        return {
          ...current,
          [key]: current[key].filter((entry) => entry._id !== item._id),
          stats: {
            ...current.stats,
            [key]: Math.max(0, Number(current.stats[key] || 0) - 1),
          },
          activity: response.data.activity
            ? [response.data.activity, ...(current.activity || [])].slice(0, 100)
            : current.activity,
        };
      });

      window.alert(
        response.data.auditLogged === false
          ? `${targetLabel.charAt(0).toUpperCase()}${targetLabel.slice(1)} deleted, but the activity log could not be saved.`
          : `${targetLabel.charAt(0).toUpperCase()}${targetLabel.slice(1)} deleted successfully.`,
      );
    } catch (requestError) {
      window.alert(
        requestError.response?.data?.msg || "Unable to delete this account.",
      );
    }
  };

  const views = useMemo(() => {
    if (!data) return {};
    return {
      users: filterRows(data.users, (user) => [
        user.name,
        user.email,
        user.mobile,
      ]),
      providers: filterRows(data.providers, (provider) => [
        provider.name,
        provider.email,
        provider.mobile,
        provider.jobCategory,
      ]),
      requests: filterRows(data.requests, (request) => [
        request.serviceTitle,
        request.serviceDescription,
        request.customer?.name,
        request.customer?.email,
        request.provider?.name,
        request.status,
      ]),
      messages: filterRows(data.messages, (message) => [
        message.name,
        message.email,
        message.message,
        message.kind,
      ]),
      catalog: filterRows(data.serviceCategories, (service) => [
        service.title,
        service.discription,
      ]),
      feedback: filterRows(data.feedback, (item) => [item.name, item.feedback]),
      activity: filterRows(data.activity || [], (item) => [
        item.adminEmail,
        item.action,
        item.targetType,
        item.targetName,
        item.targetEmail,
        item.summary,
      ]),
    };
  }, [data, filterRows]);

  const weeklyActivity = useMemo(() => {
    if (!data) return [];
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      return {
        date,
        key,
        label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
          date,
        ),
        users: 0,
        providers: 0,
        requests: 0,
      };
    });
    const byDay = new Map(days.map((day) => [day.key, day]));
    const addCount = (items, field) => {
      items.forEach((item) => {
        if (!item.createdAt) return;
        const date = new Date(item.createdAt);
        const day = byDay.get(
          `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        );
        if (day) day[field] += 1;
      });
    };
    addCount(data.users, "users");
    addCount(data.providers, "providers");
    addCount(data.requests, "requests");
    return days;
  }, [data]);

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f8f4]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
      </main>
    );

  if (!data)
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error || "Unable to load the admin dashboard."}
        </p>
        <button
          onClick={() => navigate("/Admin")}
          className="mt-5 rounded-xl bg-[#123f35] px-5 py-3 text-sm font-semibold text-white"
        >
          Return to admin sign in
        </button>
      </main>
    );

  const stats = [
    {
      label: "Registered users",
      value: data.stats.users,
      icon: Users,
      accent: "text-sky-700 bg-sky-50",
    },
    {
      label: "Service providers",
      value: data.stats.providers,
      icon: BriefcaseBusiness,
      accent: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "New leads",
      value: data.stats.newLeads,
      icon: ArrowDownLeft,
      accent: "text-amber-700 bg-amber-50",
    },
    {
      label: "Total requests",
      value: data.stats.requests,
      icon: ClipboardList,
      accent: "text-slate-700 bg-slate-100",
    },
    {
      label: "Active jobs",
      value: data.stats.activeJobs,
      icon: Activity,
      accent: "text-violet-700 bg-violet-50",
    },
    {
      label: "Completed jobs",
      value: data.stats.completedJobs,
      icon: Star,
      accent: "text-teal-700 bg-teal-50",
    },
  ];
  const chartMaximum = Math.max(
    1,
    ...weeklyActivity.map((day) => day.users + day.providers + day.requests),
  );

  return (
    <main className="min-h-screen bg-[#f5f8f4]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#123f35] text-amber-300">
              <ShieldCheck size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                UrbanAssist
              </p>
              <h1 className="truncate text-lg font-semibold text-slate-900">
                Super admin
              </h1>
            </div>
          </div>

          <button
            onClick={signOut}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-8">
        <aside className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveView(id);
                setSearch("");
              }}
              className={`inline-flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:flex lg:w-full ${activeView === id ? "bg-[#123f35] text-white" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </aside>

        <section className="min-w-0">
          {error && (
            <p
              role="status"
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {error}
            </p>
          )}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Platform overview
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {VIEWS.find((view) => view.id === activeView)?.label}
              </h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {activeView !== "overview" && (
                <label className="relative block w-full sm:max-w-xs">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search this view"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />
                </label>
              )}
              <button
                type="button"
                onClick={refreshDashboard}
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 disabled:opacity-60"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {activeView === "overview" ? (
            <>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {stats.map(({ label, value, icon: Icon, accent }) => (
                  <article
                    key={label}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:gap-4 sm:p-5"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
                    >
                      <Icon size={19} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-2xl font-semibold leading-none text-slate-900">
                        {value}
                      </p>
                      <p className="mt-2 truncate text-xs font-medium text-slate-500">
                        {label}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <TrendingUp size={17} className="text-emerald-700" />
                      Platform activity
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      New users, providers, and service requests · last 7 days
                    </p>
                  </div>
                  <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-4">
                    {weeklyActivity.map((day) => (
                      <div
                        key={day.key}
                        className="flex min-w-0 flex-col items-center gap-2"
                      >
                        <div className="flex h-32 w-full items-end justify-center border-b border-slate-100 pb-1">
                          <div className="flex h-full w-full max-w-8 flex-col justify-end overflow-hidden rounded-t-lg bg-slate-100">
                            <div
                              className="w-full bg-sky-500"
                              style={{ height: `${(day.users / chartMaximum) * 100}%` }}
                              title={`${day.users} users`}
                            />
                            <div
                              className="w-full bg-emerald-500"
                              style={{ height: `${(day.providers / chartMaximum) * 100}%` }}
                              title={`${day.providers} providers`}
                            />
                            <div
                              className="w-full bg-amber-400"
                              style={{ height: `${(day.requests / chartMaximum) * 100}%` }}
                              title={`${day.requests} requests`}
                            />
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">
                          {day.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-sky-500" />Users</span>
                    <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Providers</span>
                    <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" />Requests</span>
                  </div>
                </article>
                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">Admin activity</h3>
                      <p className="mt-1 text-xs text-slate-500">Recent account actions</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView("activity")}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
                    >
                      View log
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {(data.activity || []).slice(0, 5).map((item) => (
                      <div key={item._id} className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-800">
                          {item.summary}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.adminEmail} · {formatDate(item.createdAt)}
                        </p>
                      </div>
                    ))}
                    {!(data.activity || []).length && (
                      <p className="px-5 py-10 text-center text-sm text-slate-500">
                        Admin actions will appear here.
                      </p>
                    )}
                  </div>
                </article>
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">
                      Latest service leads
                    </h3>
                  </div>
                  <DataTable
                    rows={data.requests.slice(0, 6)}
                    emptyText="No requests yet."
                    columns={[
                      {
                        label: "Request",
                        render: (row) => (
                          <>
                            <span className="block font-semibold text-slate-800">
                              {row.serviceTitle}
                            </span>
                            <span className="text-xs text-slate-500">
                              {row.customer?.name || "Customer"} →{" "}
                              {row.provider?.name || "Provider"}
                            </span>
                          </>
                        ),
                      },
                      {
                        label: "Status",
                        render: (row) => <StatusBadge status={row.status} />,
                      },
                      {
                        label: "Created",
                        render: (row) => formatDate(row.createdAt),
                      },
                    ]}
                  />
                </article>
                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">
                      Latest messages
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {data.messages.slice(0, 6).map((item) => (
                      <div key={item._id} className="px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.name}{" "}
                            <span className="font-normal text-slate-400">
                              · {item.kind === "chat" ? "Chat" : "Contact"}
                            </span>
                          </p>
                          <time className="shrink-0 text-xs text-slate-400">
                            {formatDate(item.createdAt)}
                          </time>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {item.message}
                        </p>
                      </div>
                    ))}
                    {!data.messages.length && (
                      <p className="px-5 py-10 text-center text-sm text-slate-500">
                        No messages yet.
                      </p>
                    )}
                  </div>
                </article>
              </div>
            </>
          ) : null}

          {activeView === "users" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <DataTable
                rows={views.users || []}
                emptyText="No matching users."
                columns={[
                  { label: "Name", key: "name" },
                  { label: "Email", key: "email" },
                  { label: "Mobile", key: "mobile" },
                  {
                    label: "Joined",
                    render: (row) => formatDate(row.createdAt),
                  },
                  {
                    label: "Action",
                    render: (row) => (
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount("user", row)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    ),
                  },
                ]}
              />
            </article>
          )}
          {activeView === "providers" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <DataTable
                rows={views.providers || []}
                emptyText="No matching providers."
                columns={[
                  {
                    label: "Provider",
                    render: (row) => (
                      <>
                        <span className="block font-semibold text-slate-800">
                          {row.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {row.email}
                        </span>
                      </>
                    ),
                  },
                  { label: "Service", key: "jobCategory" },
                  { label: "Mobile", key: "mobile" },
                  {
                    label: "Rate",
                    render: (row) => (row.salary ? `₹${row.salary}` : "—"),
                  },
                  {
                    label: "Joined",
                    render: (row) => formatDate(row.createdAt),
                  },
                  {
                    label: "Action",
                    render: (row) => (
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount("provider", row)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    ),
                  },
                ]}
              />
            </article>
          )}
          {activeView === "requests" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <DataTable
                rows={views.requests || []}
                emptyText="No matching requests."
                columns={[
                  {
                    label: "Service",
                    render: (row) => (
                      <>
                        <span className="block font-semibold text-slate-800">
                          {row.serviceTitle}
                        </span>
                        <span className="line-clamp-2 text-xs text-slate-500">
                          {row.serviceDescription}
                        </span>
                      </>
                    ),
                  },
                  {
                    label: "Customer",
                    render: (row) => row.customer?.name || "—",
                  },
                  {
                    label: "Provider",
                    render: (row) => row.provider?.name || "—",
                  },
                  {
                    label: "Status",
                    render: (row) => <StatusBadge status={row.status} />,
                  },
                  {
                    label: "Scheduled",
                    render: (row) =>
                      `${formatDate(row.date)}${row.time ? ` · ${row.time}` : ""}`,
                  },
                ]}
              />
            </article>
          )}
          {activeView === "messages" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <DataTable
                rows={views.messages || []}
                emptyText="No matching messages."
                columns={[
                  {
                    label: "From",
                    render: (row) => (
                      <>
                        <span className="block font-semibold text-slate-800">
                          {row.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {row.email}
                        </span>
                      </>
                    ),
                  },
                  {
                    label: "Type",
                    render: (row) => (row.kind === "chat" ? "Chat" : "Contact"),
                  },
                  {
                    label: "Message",
                    render: (row) => (
                      <span className="line-clamp-3">{row.message}</span>
                    ),
                  },
                  { label: "Sent", render: (row) => formatDate(row.createdAt) },
                ]}
              />
            </article>
          )}
          {activeView === "catalog" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <DataTable
                rows={views.catalog || []}
                emptyText="No service categories."
                columns={[
                  {
                    label: "Service",
                    render: (row) => (
                      <div className="flex items-center gap-3">
                        {row.photo && (
                          <img
                            src={row.photo}
                            alt=""
                            className="h-10 w-14 rounded-lg object-cover"
                          />
                        )}
                        <span className="font-semibold text-slate-800">
                          {row.title}
                        </span>
                      </div>
                    ),
                  },
                  { label: "Description", key: "discription" },
                ]}
              />
            </article>
          )}
          {activeView === "feedback" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <DataTable
                rows={views.feedback || []}
                emptyText="No feedback entries."
                columns={[
                  { label: "Name", key: "name" },
                  {
                    label: "Rating",
                    render: (row) => (row.rating ? `${row.rating} / 5` : "—"),
                  },
                  { label: "Feedback", key: "feedback" },
                ]}
              />
            </article>
          )}
          {activeView === "activity" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <DataTable
                rows={views.activity || []}
                emptyText="No admin actions have been recorded yet."
                columns={[
                  {
                    label: "When",
                    render: (row) => formatDate(row.createdAt),
                  },
                  {
                    label: "Administrator",
                    key: "adminEmail",
                  },
                  {
                    label: "Action",
                    render: (row) => (
                      <>
                        <span className="block font-semibold text-slate-800">
                          {row.action} {row.targetType}
                        </span>
                        <span className="text-xs text-slate-500">
                          {row.summary}
                        </span>
                      </>
                    ),
                  },
                  {
                    label: "Target",
                    render: (row) => (
                      <>
                        <span className="block">{row.targetName || "—"}</span>
                        <span className="text-xs text-slate-500">
                          {row.targetEmail || row.targetId}
                        </span>
                      </>
                    ),
                  },
                  {
                    label: "Request reference",
                    render: (row) => row.requestId || "—",
                  },
                ]}
              />
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
