"use client";

import axios from "axios";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Send, UserRound } from "lucide-react";
import { useNavigate } from "../next-router";
import { useMessage, useSocket } from "../providers";
import { getSession } from "../../lib/auth-client";

export default function ProviderInbox({
  embedded = false,
  dashboardProviderId = "",
  accountType = "provider",
}) {
  const navigate = useNavigate();
  const socket = useSocket();
  const { showMessage } = useMessage();
  const isCustomer = accountType === "customer";
  const [accountId, setAccountId] = useState(dashboardProviderId);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (embedded && !dashboardProviderId) return;
    setLoading(true);
    const expectedRole = isCustomer ? "user" : "ServiceProvider";
    getSession()
      .then((session) => {
        if (session.role !== expectedRole) {
          navigate("/login");
          return null;
        }
        const currentAccountId = isCustomer
          ? session.userId
          : dashboardProviderId;
        return Promise.all([
          currentAccountId
            ? Promise.resolve({ data: { user: { _id: currentAccountId } } })
            : axios.post("/api/serviceProvider/verify", {}),
          axios.get(
            isCustomer ? "/api/sendMessage/myChats" : "/api/sendMessage/chat",
          ),
        ]);
      })
      .then((results) => {
        if (!results) return;
        const [profileResponse, inboxResponse] = results;
        setAccountId(profileResponse.data.user._id);
        setConversations(inboxResponse.data);
      })
      .catch((error) => console.error("Unable to load provider inbox", error))
      .finally(() => setLoading(false));
  }, [navigate, embedded, dashboardProviderId, isCustomer]);

  useEffect(() => {
    if (!activeConversation || !accountId) return undefined;
    const providerId = isCustomer
      ? activeConversation.participantId
      : accountId;
    const customerQuery = isCustomer
      ? ""
      : `?userId=${activeConversation.participantId}`;
    axios
      .get(`/api/sendMessage/chat/${providerId}${customerQuery}`)
      .then((response) => setMessages(response.data))
      .catch((error) => console.error("Unable to load conversation", error));
  }, [activeConversation, accountId, isCustomer]);

  useEffect(() => {
    if (!socket || !accountId) return undefined;
    const receiveMessage = (event) => {
      const belongsToAccount = isCustomer
        ? event.userId === accountId
        : event.providerId === accountId;
      if (!belongsToAccount) return;
      const participantId = isCustomer ? event.providerId : event.userId;
      setConversations((previous) => {
        const existing = previous.find(
          (conversation) => conversation.participantId === participantId,
        );
        const updated = existing
          ? { ...existing, lastMessage: event.message }
          : {
              participantId,
              participantName: event.message.name,
              participantEmail: event.message.email,
              participantImage: "",
              participantCategory: isCustomer ? "Service provider" : "Customer",
              lastMessage: event.message,
            };
        return [
          updated,
          ...previous.filter(
            (conversation) => conversation.participantId !== participantId,
          ),
        ];
      });
      if (activeConversation?.participantId === participantId) {
        setMessages((previous) =>
          previous.some((message) => message._id === event.message._id)
            ? previous
            : [...previous, event.message],
        );
      }
    };
    socket.on("chatMessage", receiveMessage);
    return () => socket.off("chatMessage", receiveMessage);
  }, [socket, accountId, activeConversation, isCustomer]);

  const sendReply = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !activeConversation || sending) return;
    setSending(true);
    try {
      const response = await axios.post(
        "/api/sendMessage/chat",
        {
          [isCustomer ? "providerId" : "userId"]:
            activeConversation.participantId,
          message,
        },
        {},
      );
      socket?.emit("chatMessage", {
        providerId: isCustomer ? activeConversation.participantId : accountId,
        userId: isCustomer ? accountId : activeConversation.participantId,
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
        "Unable to send provider reply",
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

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${embedded ? "min-h-[320px]" : "min-h-[70vh] bg-[#f5f8f4]"}`}
      >
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "bg-white"
          : "min-h-[75vh] bg-[#f5f8f4] px-4 py-8 sm:px-6 lg:px-8"
      }
    >
      <div className={embedded ? "" : "mx-auto max-w-7xl"}>
        {!embedded && (
          <button
            type="button"
            onClick={() => navigate(isCustomer ? "/services" : "/")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800"
          >
            <ArrowLeft size={16} />
            {isCustomer ? "Back to services" : "Back to dashboard"}
          </button>
        )}
        <section
          className={`grid overflow-hidden border-slate-200 bg-white md:grid-cols-[320px_1fr] ${embedded ? "min-h-[480px] border-0 md:grid-cols-[280px_1fr]" : "min-h-[620px] rounded-3xl border shadow-xl shadow-slate-900/5"}`}
        >
          <aside
            className={`${activeConversation ? "hidden md:block" : ""} border-b border-slate-200 md:border-b-0 md:border-r`}
          >
            <div className="border-b border-slate-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                {isCustomer ? "Customer inbox" : "Provider inbox"}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                Messages
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {conversations.length} conversations
              </p>
            </div>
            <div
              className={`${embedded ? "max-h-[420px]" : "max-h-[520px]"} overflow-y-auto`}
            >
              {conversations.length ? (
                conversations.map((conversation) => (
                  <button
                    type="button"
                    key={conversation.participantId}
                    onClick={() => {
                      setActiveConversation(conversation);
                      setMessages([]);
                    }}
                    className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-emerald-50 ${activeConversation?.participantId === conversation.participantId ? "bg-emerald-50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                        <UserRound size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {conversation.participantName}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {conversation.lastMessage.message}
                        </span>
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-6 py-14 text-center">
                  <MessageCircle size={28} className="mx-auto text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No conversations yet
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Customer messages will appear here.
                  </p>
                </div>
              )}
            </div>
          </aside>
          <section
            className={
              (activeConversation ? "flex" : "hidden md:flex") +
              " " +
              (embedded ? "min-h-[480px]" : "min-h-[620px]") +
              " flex-col"
            }
          >
            {activeConversation ? (
              <>
                <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                  <button
                    type="button"
                    onClick={() => setActiveConversation(null)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
                    aria-label="Back to inbox"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <UserRound size={18} />
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {activeConversation.participantName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {activeConversation.participantEmail}
                    </p>
                  </div>
                </header>
                <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7faf8] px-4 py-5 sm:px-6">
                  {messages.map((message) => {
                    const ownMessage =
                      message.senderId?.toString() === accountId;
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
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              { hour: "numeric", minute: "2-digit" },
                            )}
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
                <form
                  onSubmit={sendReply}
                  className="flex items-end gap-2 border-t border-slate-100 p-3 sm:p-4"
                >
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.ctrlKey &&
                        !event.metaKey
                      ) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={1}
                    maxLength={2000}
                    placeholder="Write a reply… (Enter to send, Ctrl+Enter for a new line)"
                    className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    aria-label="Send reply"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#123f35] text-white transition hover:bg-[#0c3028] disabled:opacity-40"
                  >
                    <Send size={17} />
                  </button>
                </form>
              </>
            ) : (
              <div className="m-auto hidden max-w-sm px-6 text-center md:block">
                <MessageCircle size={36} className="mx-auto text-emerald-700" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">
                  Choose a conversation
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isCustomer
                    ? "Messages from your service providers will appear here."
                    : "Select a customer message from the inbox to reply."}
                </p>
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
}

ProviderInbox.propTypes = {
  embedded: PropTypes.bool,
  dashboardProviderId: PropTypes.string,
  accountType: PropTypes.oneOf(["provider", "customer"]),
};
