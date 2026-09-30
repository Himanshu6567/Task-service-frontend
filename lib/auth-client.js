import axios from "axios";

export async function getSession() {
  const response = await axios.get("/api/auth/session");
  return response.data;
}

export async function logout() {
  await axios.post("/api/auth/logout");
}
