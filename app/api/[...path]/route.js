import {
  connectDatabase,
  parseRequestBody,
  sendController,
} from "../../../lib/server-api";
import {
  handleCreateNewUser,
  handleLogInUser,
} from "../../../../Server/Controller/UserController";
import {
  handleSendSignupOtp,
  handleVerifySignupOtp,
} from "../../../../Server/Controller/SignupOtpController";
import {
  handleCreateNewServiceProvider,
  handleLogInServiceProvider,
  handleVerifyToken,
  handlegetallServiceProvider,
} from "../../../../Server/Controller/ServiceProviderController";
import {
  handleCreateNewService,
  handlegetAllTasks,
  handleGetUserBookings,
  handleAcceptReq,
  handleRejectReq,
} from "../../../../Server/Controller/ServiceController";
import { handleGetAllInntialService } from "../../../../Server/Controller/ServiceInitialContraller";
import { handleGetFeedbacks } from "../../../../Server/Controller/FeedbackController";
import {
  handleCreateNewMessage,
  handleCreateChatMessage,
  handleGetChatMessages,
  handleGetProviderConversations,
  handleGetUserConversations,
} from "../../../../Server/Controller/MessageController";
import {
  handleAdminLogin,
  handleGetAdminDashboard,
  handleDeleteUser,
  handleDeleteProvider,
  handleGetSession,
  handleLogout,
} from "../../../../Server/Controller/AdminController";

const controllers = {
  "POST user/createNewUser": handleCreateNewUser,
  "POST user/loginUser": handleLogInUser,
  "POST signup/send-otp": handleSendSignupOtp,
  "POST signup/verify-otp": handleVerifySignupOtp,
  "POST serviceProvider/createNewServiceProvider":
    handleCreateNewServiceProvider[1],
  "POST serviceProvider/logInServiceProvider": handleLogInServiceProvider,
  "POST serviceProvider/verify": handleVerifyToken,
  "GET serviceProvider/getAllProvider": handlegetallServiceProvider,
  "POST services/NewService": handleCreateNewService,
  "GET services/allTasks": handlegetAllTasks,
  "GET services/myBookings": handleGetUserBookings,
  "PATCH services/acceptReq": handleAcceptReq,
  "GET initialService": handleGetAllInntialService,
  "GET Feedbacks": handleGetFeedbacks,
  "POST sendMessage": handleCreateNewMessage,
  "POST sendMessage/chat": handleCreateChatMessage,
  "GET sendMessage/chat": handleGetProviderConversations,
  "GET sendMessage/myChats": handleGetUserConversations,
  "POST admin/login": handleAdminLogin,
  "GET auth/session": handleGetSession,
  "POST auth/logout": handleLogout,
  "GET admin/dashboard": handleGetAdminDashboard,
  "DELETE admin/delete-user": handleDeleteUser,
  "DELETE admin/delete-provider": handleDeleteProvider,
};

async function handler(request, context) {
  const { path } = await context.params;
  const route = path.join("/");

  // Admin/session handlers are only implemented by the Next.js API layer.
  // All other endpoints are served by the standalone Express API.
  if (!route.startsWith("admin/") && !route.startsWith("auth/")) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return Response.json(
        { msg: "NEXT_PUBLIC_BACKEND_URL is not configured" },
        { status: 500 },
      );
    }

    const backendPath =
      route === "initialService" || route === "Feedbacks"
        ? `${route}/`
        : route;
    const target = new URL(
      `${backendPath}${new URL(request.url).search}`,
      `${backendUrl.replace(/\/+$/, "")}/`,
    );
    const headers = new Headers();
    for (const name of ["authorization", "cookie", "content-type"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.arrayBuffer(),
      cache: "no-store",
    });
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  }

  await connectDatabase();
  const { body, file } = await parseRequestBody(request);
  const key = `${request.method} ${route}`;
  const controller = controllers[key];

  if (controller) {
    return sendController(controller, request, body, {}, file);
  }

  if (request.method === "GET" && route.startsWith("sendMessage/chat/")) {
    return sendController(
      handleGetChatMessages,
      request,
      body,
      { ProviderId: route.split("/").pop() },
      file,
    );
  }

  if (request.method === "DELETE" && route.startsWith("services/rejectReq/")) {
    return sendController(
      handleRejectReq,
      request,
      body,
      { TaskId: route.split("/").pop() },
      file,
    );
  }

  if (request.method === "DELETE" && route.startsWith("admin/delete-user/")) {
    return sendController(
      handleDeleteUser,
      request,
      body,
      { userId: route.split("/").pop() },
      file,
    );
  }

  if (
    request.method === "DELETE" &&
    route.startsWith("admin/delete-provider/")
  ) {
    return sendController(
      handleDeleteProvider,
      request,
      body,
      { providerId: route.split("/").pop() },
      file,
    );
  }

  return Response.json({ msg: "Route not found" }, { status: 404 });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
