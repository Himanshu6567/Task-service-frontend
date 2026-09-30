"use client";

import {
  StrictMode,
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";
import { io } from "socket.io-client";
import { usePathname } from "next/navigation";
import { CircleAlert, Info, CheckCircle2, X } from "lucide-react";
import { getSession } from "../lib/auth-client";
import NavbarComponent from "./components/Navbar";
import FooterComponent from "./components/Footer";

const MessageContext = createContext();
const LocationContext = createContext();
const SocketContext = createContext();

export const useMessage = () => useContext(MessageContext);
export const useLocation = () => useContext(LocationContext);
export const useSocket = () => useContext(SocketContext);

function MessageProvider({ children }) {
  const [messageData, setMessageData] = useState({ type: "", message: "" });
  const [showMgs, setShowMgs] = useState(false);
  const showMessage = useCallback((type, message) => {
    setMessageData({ type, message });
    setShowMgs(true);
  }, []);
  const contextValue = useMemo(
    () => ({ messageData, showMgs, setShowMgs, showMessage }),
    [messageData, showMgs, showMessage],
  );
  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
}
MessageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

function LocationProvider({ children }) {
  const { showMessage } = useContext(MessageContext);
  const [myLocation, setMyLocation] = useState({ lat: "", long: "" });
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) =>
          setMyLocation({ lat: latitude, long: longitude }),
        (error) => console.error("Error getting location:", error.message),
      );
    } else {
      showMessage("Error", "Geolocation is not supported by your browser.");
      console.log("Geolocation is not supported by your browser.");
    }
  }, [showMessage]);
  return (
    <LocationContext.Provider value={myLocation}>
      {children}
    </LocationContext.Provider>
  );
}
LocationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { showMessage } = useContext(MessageContext);
  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });
    const handleSocketError = (error) => {
      console.error(
        "[socket] connection failed",
        JSON.stringify({ url: socketUrl, message: error.message }),
      );
    };
    socketInstance.on("connect_error", handleSocketError);
    setSocket(socketInstance);
    getSession()
      .then((session) => {
        const UserId = String(session.userId || "");
        if (!UserId) return;
        socketInstance.on("reqAccept", (data) => {
          const { task } = data;
          if (UserId === task.userId)
            showMessage(
              "success",
              "Your request has been accepted by Service Provider",
            );
        });
        socketInstance.on("reqReject", (data) => {
          const { task } = data;
          if (UserId === task.userId)
            showMessage(
              "error",
              "Your request has been rejected by Service Provider",
            );
        });
      })
      .catch(() => {});
    return () => {
      socketInstance.off("connect_error", handleSocketError);
      socketInstance.off("reqAccept");
      socketInstance.off("reqReject");
      socketInstance.disconnect();
    };
  }, [showMessage]);
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

function Message() {
  const [processValue, setProcessValue] = useState(100);
  const { messageData, showMgs, setShowMgs } = useContext(MessageContext);
  useEffect(() => {
    if (!showMgs) return undefined;
    setProcessValue(100);
    const hideTimeout = setTimeout(() => setShowMgs(false), 3000);
    const interval = setInterval(
      () => setProcessValue((prev) => Math.max(prev - 100 / 30, 0)),
      100,
    );
    return () => {
      clearTimeout(hideTimeout);
      clearInterval(interval);
    };
  }, [showMgs, messageData, setShowMgs]);
  const type = messageData.type?.toLowerCase();
  const isSuccess = type === "success";
  const isError = type === "error";
  const Icon = isSuccess ? CheckCircle2 : isError ? CircleAlert : Info;
  const toneClasses = isSuccess
    ? {
        icon: "bg-emerald-100 text-emerald-700",
        progress: "bg-emerald-600",
        label: "text-emerald-700",
      }
    : isError
      ? {
          icon: "bg-rose-100 text-rose-700",
          progress: "bg-rose-600",
          label: "text-rose-700",
        }
      : {
          icon: "bg-sky-100 text-sky-700",
          progress: "bg-sky-600",
          label: "text-sky-700",
        };

  return (
    showMgs && (
      <div
        className="fixed inset-x-3 top-4 z-[100] mx-auto w-auto max-w-md sm:inset-x-auto sm:right-6 sm:top-6 sm:w-full"
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        aria-atomic="true"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-black/5">
          <div className="flex items-start gap-3 p-4 sm:p-5">
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses.icon}`}
            >
              <Icon size={20} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={`text-xs font-semibold uppercase tracking-[0.12em] ${toneClasses.label}`}
              >
                {messageData.type || "Notification"}
              </p>
              <p className="mt-1 break-words text-sm leading-5 text-slate-700">
                {messageData.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMgs(false)}
              className="-mr-1 -mt-1 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              aria-label="Dismiss notification"
            >
              <X size={18} />
            </button>
          </div>
          <div className="h-1 w-full bg-slate-100" aria-hidden="true">
            <div
              className={`h-full transition-[width] duration-100 ease-linear ${toneClasses.progress}`}
              style={{ width: `${processValue}%` }}
            />
          </div>
        </div>
      </div>
    )
  );
}

function AppShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.toLowerCase().startsWith("/admin");
  return (
    <SocketProvider>
      <div className="flex min-h-screen flex-col">
        {!isAdminRoute && <NavbarComponent />}
        <div className="flex-1">{children}</div>
        {!isAdminRoute && <FooterComponent />}
      </div>
      <Message />
    </SocketProvider>
  );
}
AppShell.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function Providers({ children }) {
  return (
    <MessageProvider>
      <LocationProvider>
        <StrictMode>
          <AppShell>{children}</AppShell>
        </StrictMode>
      </LocationProvider>
    </MessageProvider>
  );
}

Providers.propTypes = {
  children: PropTypes.node.isRequired,
};
