export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL?.trim() ||
  import.meta.env.VITE_AGENT_BACKEND_URL?.trim() ||
  "";

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie.split("; ").find((value) => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

function csrfHeader() {
  if (typeof document === "undefined") return null;
  const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
  if (metaToken) return ["X-CSRF-Token", metaToken];
  const xsrfToken = readCookie("XSRF-TOKEN");
  if (xsrfToken) return ["X-XSRF-TOKEN", xsrfToken];
  const csrfToken = readCookie("CSRF-TOKEN");
  return csrfToken ? ["X-CSRF-Token", csrfToken] : null;
}

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, { body, headers, ...options } = {}) {
  const method = (options.method || (body === undefined ? "GET" : "POST")).toUpperCase();
  const isUnsafe = !["GET", "HEAD", "OPTIONS"].includes(method);

  // XSRF-TOKEN 쿠키는 GET /api/session이 호출돼야만 발급된다(지연 로딩). 앱이 마운트된
  // 이후 오래 켜놨거나 세션 체크가 스킵된 탭에서는 쿠키가 없을 수 있으므로, 변경 요청 직전에
  // 쿠키가 없으면 먼저 세션 조회를 한 번 찔러서 발급받는다.
  if (isUnsafe && !readCookie("XSRF-TOKEN") && !document.querySelector('meta[name="csrf-token"]')) {
    await fetch(`${API_BASE_URL}/api/session`, { credentials: "include" }).catch(() => {});
  }

  const csrf = csrfHeader();
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (csrf && isUnsafe) {
    requestHeaders.set(csrf[0], csrf[1]);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    credentials: "include",
    headers: requestHeaders,
    body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const details = await (contentType.includes("json") ? response.json() : response.text()).catch(() => null);
    const message =
      details?.detail || details?.message || (typeof details === "string" && details) || response.statusText || "요청에 실패했습니다.";
    throw new ApiError(message, { status: response.status, code: details?.code, details });
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("json") ? response.json() : response.text();
}
