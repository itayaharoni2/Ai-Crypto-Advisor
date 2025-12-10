// base URL if VITE_API_BASE_URL doesnt exists in .env
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// when we get 401 unauthorized - delets username and token
function handleUnauthorized() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  window.location.href = "/login";
}

// main function
export async function apiFetch(path, options = {}) {
  const { method = "GET", body, auth = true, headers = {}, ...rest } = options;

  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // performs the actual fetch
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Unauthorized");
  }

  return response;
}
