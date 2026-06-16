const API_BASE_URL = "http://localhost:8000/api";

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

// ---------------------------------------------------------------------------
// Token handling
// ---------------------------------------------------------------------------

const TOKEN_KEY = "evolio_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}


async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let payload = body;
  if (body && !isForm) {
    // Send JSON for normal requests.
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  // For FormData (file uploads) we let the browser set the Content-Type.

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
  });

  // Basic unauthorized handling: clear the token so the app can react.
  if (res.status === 401) {
    clearToken();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.detail) message = data.detail;
    } catch {
      // Response had no JSON body; keep the default message.
    }
    throw new Error(message);
  }

  // Some endpoints (e.g. delete) may return an empty body.
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function registerUser(data) {
  return request("/auth/register", { method: "POST", body: data });
}

export function loginUser(data) {
  return request("/auth/login", { method: "POST", body: data });
}

export function getCurrentUser() {
  return request("/auth/me");
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export function getProfile() {
  return request("/profile");
}

export function updateProfile(data) {
  return request("/profile", { method: "PUT", body: data });
}

// ---------------------------------------------------------------------------
// Resume
// ---------------------------------------------------------------------------

export function uploadResume(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/resume/upload", { method: "POST", body: form, isForm: true });
}

export function getResume() {
  return request("/resume");
}

// Returns the download URL (the actual file is served by the backend).
export function downloadResume() {
  return `${API_BASE_URL}/resume/download`;
}

export function deleteResume() {
  return request("/resume", { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function getProjects() {
  return request("/projects");
}

export function getProject(id) {
  return request(`/projects/${id}`);
}

export function createProject(data) {
  return request("/projects", { method: "POST", body: data });
}

export function updateProject(id, data) {
  return request(`/projects/${id}`, { method: "PUT", body: data });
}

export function deleteProject(id) {
  return request(`/projects/${id}`, { method: "DELETE" });
}

export function saveProjectContent(id, content) {
  return request(`/projects/${id}/content`, {
    method: "PUT",
    body: { content },
  });
}

// ---------------------------------------------------------------------------
// Project images
// ---------------------------------------------------------------------------

export function uploadProjectImage(projectId, file) {
  const form = new FormData();
  form.append("file", file);
  return request(`/projects/${projectId}/images`, {
    method: "POST",
    body: form,
    isForm: true,
  });
}

export function getProjectImages(projectId) {
  return request(`/projects/${projectId}/images`);
}

export function deleteProjectImage(projectId, imageId) {
  return request(`/projects/${projectId}/images/${imageId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Share links
// ---------------------------------------------------------------------------

export function generateShareLink(data = {}) {
  return request("/share/generate", { method: "POST", body: data });
}

// Public portfolio view (no auth needed).
export function getPublicPortfolio(token) {
  return request(`/share/${token}`);
}

export function updateShareSettings(data) {
  return request("/share/settings", { method: "PUT", body: data });
}

// ---------------------------------------------------------------------------
// Review workflow
// ---------------------------------------------------------------------------

export function submitReview() {
  return request("/review/submit", { method: "POST", body: {} });
}

export function getReviewStatus() {
  return request("/review/status");
}

export function getReviewFeedback() {
  return request("/review/feedback");
}
