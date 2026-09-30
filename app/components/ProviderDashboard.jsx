"use client";

import axios from "axios";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  ArrowDownUp,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ClipboardList,
  LogOut,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  Star,
  X,
} from "lucide-react";
import { useNavigate } from "../next-router";
import { useLocation, useMessage, useSocket } from "../providers";
import ProviderInbox from "./ProviderInbox";
import { getSession, logout } from "../../lib/auth-client";

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

function ServiceProviderRoute({ children }) {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(null);
  useEffect(() => {
    getSession()
      .then((session) => {
        if (session.role === "ServiceProvider") setAuthenticated(true);
        else navigate("/");
      })
      .catch(() => navigate("/login"));
  }, [navigate]);
  return authenticated === null ? <div>Loading...</div> : children;
}
ServiceProviderRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function Loading2() {
  return (
    <div className="flex items-center justify-center h-[700px]">
      <div className="w-20 h-20 border-4 border-transparent rounded-full animate-spin border-t-blue-400" />
    </div>
  );
}

function MapWithDriverPath({ myLocation, taskLocation, handleCloseMap }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadMap = () => {
      const map = new window.google.maps.Map(document.getElementById("map"), {
        center: { lat: myLocation.lat, lng: myLocation.long },
        zoom: 20,
      });
      const renderer = new window.google.maps.DirectionsRenderer();
      renderer.setMap(map);
      new window.google.maps.DirectionsService().route(
        {
          origin: { lat: myLocation.lat, lng: myLocation.long },
          destination: {
            lat: +taskLocation.latitude,
            lng: +taskLocation.longitude,
          },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK)
            renderer.setDirections(result);
          else console.error("Directions request failed due to " + status);
          setLoading(false);
        },
      );
    };
    if (!window.google || !window.google.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.gomaps.pro/maps/api/js?key="MY_Api_KEY"&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      window.initMap = loadMap;
    } else loadMap();
  }, [myLocation, taskLocation]);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
      <div className="absolute pt-2 bg-white border border-black rounded-t-2xl">
        <div className="flex justify-end px-4">
          <button onClick={handleCloseMap}>X</button>
        </div>
        {loading && (
          <div className="flex items-center justify-center w-96 h-96">
            <p>Loading map...</p>
          </div>
        )}
        <div
          id="map"
          className={`border-2 w-96 h-96 ${loading ? "hidden" : ""}`}
        />
      </div>
    </div>
  );
}
MapWithDriverPath.propTypes = {
  myLocation: PropTypes.shape({
    lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    long: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  taskLocation: PropTypes.shape({
    latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
  }).isRequired,
  handleCloseMap: PropTypes.func.isRequired,
};

function UserProfile() {
  const myLocation = useLocation();
  const socket = useSocket();
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const [userData, setUserData] = useState({});
  const [allTasks, setAllTasks] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requests");
  const [actionError, setActionError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [taskLocation, setTaskLocation] = useState({});
  const [sorting, setSorting] = useState({
    requests: "Newest",
    active: "Newest",
    completed: "Newest",
    all: "Newest",
  });
  const loadTasks = async () => {
    try {
      const response = await axios.get("/api/services/allTasks");
      const tasks = Array.isArray(response.data) ? response.data : [];
      setAllTasks(tasks);
      setAllRequests(tasks.filter((task) => task.status === "ReqPending"));
      setPendingTasks(tasks.filter((task) => task.status === "Pending"));
      setCompletedTasks(tasks.filter((task) => task.status === "Completed"));
    } catch (error) {
      console.error("Invalid credentials or something went wrong!", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    axios
      .post("/api/serviceProvider/verify", {})
      .then((response) => setUserData(response.data.user))
      .catch((error) =>
        console.error("Invalid credentials or something went wrong!", error),
      );
    loadTasks();
  }, [navigate]);
  useEffect(() => {
    if (!socket) return undefined;
    const handleNewRequest = ({ ProviderID, task }) => {
      showMessage("new", "request found");
      if (userData?._id && ProviderID === userData._id) {
        setAllRequests((previous) => [
          task,
          ...previous.filter((item) => item._id !== task._id),
        ]);
        setAllTasks((previous) => [
          task,
          ...previous.filter((item) => item._id !== task._id),
        ]);
      }
    };
    const handleRequestAccepted = ({ id, task }) => {
      showMessage("success", "Req Accepted");
      setAllRequests((previous) => previous.filter((item) => item._id !== id));
      setPendingTasks((previous) => [
        task,
        ...previous.filter((item) => item._id !== id),
      ]);
      setAllTasks((previous) =>
        previous.map((item) => (item._id === id ? task : item)),
      );
    };
    const handleRequestRejected = ({ id }) => {
      setAllRequests((previous) => previous.filter((item) => item._id !== id));
      setAllTasks((previous) => previous.filter((item) => item._id !== id));
      showMessage("success", "Req Rejected successFull");
    };
    socket.on("newRequest", handleNewRequest);
    socket.on("reqAccept", handleRequestAccepted);
    socket.on("reqReject", handleRequestRejected);
    return () => {
      socket.off("newRequest", handleNewRequest);
      socket.off("reqAccept", handleRequestAccepted);
      socket.off("reqReject", handleRequestRejected);
    };
  }, [socket, userData, showMessage]);
  const sortTasks = (tasks, criteria) =>
    [...tasks].sort((a, b) => {
      if (criteria === "Newest") return new Date(b.date) - new Date(a.date);
      if (criteria === "Oldest") return new Date(a.date) - new Date(b.date);
      return 0;
    });
  const handleSortingChange = (value) => {
    setSorting((previous) => ({ ...previous, [activeTab]: value }));
  };
  const handleAction = async (task, action) => {
    setActionError("");
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (action === "accept") {
        const response = await axios.patch(
          "/api/services/acceptReq",
          { TaskId: task._id },
          { headers },
        );
        const updatedTask = response.data.task;
        socket?.emit("reqAccept", { id: task._id, task: updatedTask });
        setAllRequests((previous) =>
          previous.filter((item) => item._id !== task._id),
        );
        setPendingTasks((previous) => [
          updatedTask,
          ...previous.filter((item) => item._id !== task._id),
        ]);
        setAllTasks((previous) =>
          previous.map((item) => (item._id === task._id ? updatedTask : item)),
        );
        showMessage("success", "Request accepted");
      } else {
        const response = await axios.delete(
          `/api/services/rejectReq/${task._id}`,
          { headers },
        );
        socket?.emit("reqReject", { id: task._id, task: response.data.task });
        setAllRequests((previous) =>
          previous.filter((item) => item._id !== task._id),
        );
        setAllTasks((previous) =>
          previous.filter((item) => item._id !== task._id),
        );
        showMessage("success", "Request declined");
      }
    } catch (error) {
      console.error("Unable to update request", error);
      setActionError(
        error.response?.data?.msg ||
          "Unable to update this request. Please try again.",
      );
    }
  };
  const formatDate = (value) => {
    const date = new Date(value);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).slice(-2)}`;
  };
  const renderTasks = (tasks, emptyText, actions = false) =>
    tasks.length ? (
      tasks.map((task) => (
        <article
          key={task._id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  {task.serviceTitle}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${task.status === "ReqPending" ? "bg-amber-100 text-amber-800" : task.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"}`}
                >
                  {task.status === "ReqPending" ? "New request" : task.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {task.serviceDescription || "No additional details provided."}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-emerald-700" />
                  {formatDate(task.date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={14} className="text-emerald-700" />
                  {task.time || "Time not specified"}
                </span>
                {task.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-700" />
                    Location shared
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setTaskLocation(task.location);
                setShowMap(true);
              }}
              disabled={!task.location || typeof task.location !== "object"}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
              title="View request location"
            >
              <MapPinned size={15} />
              Map
            </button>
          </div>
          {actions && (
            <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => handleAction(task, "reject")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                <X size={16} />
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleAction(task, "accept")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#123f35] px-4 text-sm font-semibold text-white transition hover:bg-[#0c3028]"
              >
                <Check size={16} />
                Accept request
              </button>
            </div>
          )}
        </article>
      ))
    ) : (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <ClipboardList size={32} className="mx-auto text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">{emptyText}</p>
      </div>
    );
  if (loading) return <Loading2 />;
  const taskTabs = [
    { id: "requests", label: "New requests", count: allRequests.length },
    { id: "active", label: "Active", count: pendingTasks.length },
    { id: "completed", label: "Completed", count: completedTasks.length },
    { id: "all", label: "All tasks", count: allTasks.length },
  ];
  const tasksForTab = {
    requests: allRequests,
    active: pendingTasks,
    completed: completedTasks,
    all: allTasks,
  };
  const visibleTasks = sortTasks(tasksForTab[activeTab], sorting[activeTab]);
  const getLocationLabel = (providerLocation) => {
    if (!providerLocation) return "Not provided";
    if (typeof providerLocation === "string") return "Local service area";
    if (Array.isArray(providerLocation)) return "Local service area";
    return "Location on profile";
  };
  return (
    <main className="min-h-screen bg-[#f5f8f4] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#123f35] p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-9">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[28px] border-emerald-200/10" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              src={userData.image || "/image/logo.png"}
              alt={`${userData.name || "Provider"} profile`}
              className="h-24 w-24 rounded-2xl border-4 border-white/20 object-cover shadow-lg sm:h-28 sm:w-28"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <BriefcaseBusiness size={14} className="text-amber-300" />
                Service provider dashboard
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome, {userData.name || "Provider"}
              </h1>
              <p className="mt-2 text-sm text-emerald-50/75">
                Manage requests, track work, and keep your service profile up to
                date.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300/15 px-3 py-1.5 text-sm font-medium text-amber-200">
                  <BriefcaseBusiness size={15} />
                  {userData.jobCategory || "Service provider"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-50/80">
                  <Star
                    size={15}
                    fill="currentColor"
                    className="text-amber-300"
                  />
                  {userData.rating || "New profile"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout().finally(() => navigate("/login"));
              }}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
            {[
              {
                label: "New leads",
                value: allRequests.length,
                icon: Clock3,
                tone: "text-amber-700",
              },
              {
                label: "Active jobs",
                value: pendingTasks.length,
                icon: BriefcaseBusiness,
                tone: "text-sky-700",
              },
              {
                label: "Completed jobs",
                value: completedTasks.length,
                icon: CheckCircle2,
                tone: "text-emerald-700",
              },
              {
                label: "Total jobs",
                value: allTasks.length,
                icon: ClipboardList,
                tone: "text-slate-700",
              },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="flex min-h-24 items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5"
              >
                <Icon size={19} className={`shrink-0 ${tone}`} />
                <div className="min-w-0">
                  <p className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                    {value}
                  </p>
                  <p className="mt-2 truncate text-xs font-medium text-slate-500 sm:text-sm">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                  Your profile
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Provider details
                </h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Active profile
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {userData.aboutYou ||
                "Add an introduction to help customers get to know you."}
            </p>
            <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
              <div className="flex items-start gap-3">
                <Mail size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="break-all text-sm font-medium text-slate-800">
                    {userData.email || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-800">
                    {userData.mobile || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <div>
                  <p className="text-xs text-slate-500">Service location</p>
                  <p className="text-sm font-medium text-slate-800">
                    {getLocationLabel(userData.location)}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <ClipboardList size={19} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                  Your offering
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Service information
                </h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Category</p>
                <p className="mt-1 font-semibold capitalize text-slate-900">
                  {userData.jobCategory || "Not set"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Starting rate
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {userData.salary
                    ? `₹${userData.salary} / service`
                    : "Not set"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-medium text-slate-500">
                  Services and experience
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {userData.workDescription ||
                    "No service description added yet."}
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 pt-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                  Work management
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Requests and tasks
                </h2>
              </div>
              <label className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 sm:mb-0">
                {" "}
                <ArrowDownUp size={14} />
                <select
                  value={sorting[activeTab]}
                  onChange={(event) => handleSortingChange(event.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-emerald-600"
                >
                  <option>Newest</option>
                  <option>Oldest</option>
                </select>
              </label>
            </div>
            <div
              className="mt-4 flex gap-1 overflow-x-auto"
              role="tablist"
              aria-label="Provider tasks"
            >
              {taskTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition sm:px-4 ${activeTab === tab.id ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 bg-[#f8faf8] p-4 sm:p-6">
            {actionError && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {actionError}
              </p>
            )}
            {renderTasks(
              visibleTasks,
              activeTab === "requests"
                ? "No new customer requests yet."
                : activeTab === "active"
                  ? "No active tasks right now."
                  : activeTab === "completed"
                    ? "No completed tasks yet."
                    : "No tasks to show.",
              activeTab === "requests",
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              Customer conversations
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Your inbox
            </h2>
          </div>
          <ProviderInbox embedded dashboardProviderId={userData._id || ""} />
        </section>
      </div>
      {showMap && (
        <MapWithDriverPath
          myLocation={myLocation}
          taskLocation={taskLocation}
          handleCloseMap={() => {
            setShowMap(false);
            setTaskLocation({});
          }}
        />
      )}
    </main>
  );
}

export default function ProviderDashboard() {
  return (
    <AuthRoute>
      <ServiceProviderRoute>
        <UserProfile />
      </ServiceProviderRoute>
    </AuthRoute>
  );
}
