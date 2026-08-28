import { apiRequest } from "./httpClient";
import { buildSiweMessage } from "./siwe";
import { decodeCreationOptions, decodeRequestOptions, serializeCredential } from "./webauthn";

const SESSION_KEY = "pbm.auth.session";

const endpoints = {
  session: import.meta.env.VITE_AUTH_SESSION_PATH?.trim() || "/api/session",
  logout: import.meta.env.VITE_AUTH_LOGOUT_PATH?.trim() || "/api/logout",
  registerOptions: import.meta.env.VITE_PASSKEY_REGISTER_OPTIONS_PATH?.trim() || "/api/passkeys/register/options",
  registerVerify: import.meta.env.VITE_PASSKEY_REGISTER_VERIFY_PATH?.trim() || "/api/passkeys/register",
  stepUpOptions: import.meta.env.VITE_PASSKEY_STEP_UP_OPTIONS_PATH?.trim() || "/api/login/step-up/options",
  stepUpVerify: import.meta.env.VITE_PASSKEY_STEP_UP_VERIFY_PATH?.trim() || "/api/login/step-up",
};

function storedSessionId() {
  try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
}

function rememberSession(sessionId) {
  try {
    if (sessionId) sessionStorage.setItem(SESSION_KEY, sessionId);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage may be disabled; the credentialed cookie session remains authoritative.
  }
}

function withSession(path, sessionId) {
  if (!sessionId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}sessionId=${encodeURIComponent(sessionId)}`;
}

export async function signInWithEthereum({ signer, wallet, chainId }) {
  const challenge = await apiRequest(`/api/login/nonce?wallet=${encodeURIComponent(wallet)}`, { method: "POST" });
  if (Number(challenge.chainId) !== Number(chainId)) {
    throw new Error(`로그인 네트워크가 일치하지 않습니다. Chain #${challenge.chainId}로 전환해주세요.`);
  }
  const message = buildSiweMessage({ wallet, ...challenge, chainId: challenge.chainId });
  const signature = await signer.signMessage(message);
  const session = await apiRequest("/api/login", { body: { wallet, message, signature } });
  rememberSession(session?.sessionId);
  return { ...session, wallet, chainId: Number(chainId), stepUpComplete: !session?.stepUpRequired };
}

export async function getSession() {
  const sessionId = storedSessionId();
  try {
    const session = await apiRequest(withSession(endpoints.session, sessionId));
    if (!session?.authenticated && !session?.wallet) {
      rememberSession(null);
      return null;
    }
    if (session?.sessionId) rememberSession(session.sessionId);
    return session;
  } catch (error) {
    if ([401, 404].includes(error.status)) {
      rememberSession(null);
      return null;
    }
    throw error;
  }
}

export async function logout() {
  const sessionId = storedSessionId();
  try {
    await apiRequest(endpoints.logout, { method: "POST", body: sessionId ? { sessionId } : {} });
  } finally {
    rememberSession(null);
  }
}

function requireWebAuthn() {
  if (!window.PublicKeyCredential || !navigator.credentials) {
    throw new Error("이 브라우저는 Passkey(WebAuthn)를 지원하지 않습니다.");
  }
}

export async function registerPasskey() {
  requireWebAuthn();
  const sessionId = storedSessionId();
  const options = await apiRequest(withSession(endpoints.registerOptions, sessionId), { method: "POST", body: sessionId ? { sessionId } : {} });
  const credential = await navigator.credentials.create({ publicKey: decodeCreationOptions(options.publicKey || options) });
  if (!credential) throw new Error("Passkey 등록이 취소되었습니다.");
  return apiRequest(endpoints.registerVerify, { body: { sessionId, credential: serializeCredential(credential) } });
}

export async function stepUpWithPasskey() {
  requireWebAuthn();
  const sessionId = storedSessionId();
  const options = await apiRequest(withSession(endpoints.stepUpOptions, sessionId), { method: "POST", body: sessionId ? { sessionId } : {} });
  const credential = await navigator.credentials.get({ publicKey: decodeRequestOptions(options.publicKey || options) });
  if (!credential) throw new Error("Passkey 인증이 취소되었습니다.");
  const assertion = serializeCredential(credential);
  await apiRequest(endpoints.stepUpVerify, { body: { sessionId, assertion: JSON.stringify(assertion) } });
  return { stepUpComplete: true };
}
