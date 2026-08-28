/**
 * Authenticated PBM backend client.
 *
 * All requests go through the credentialed HTTP client. Wallet query fields are
 * compatibility context for current read APIs; they are never treated by this
 * client as proof of identity or authorization.
 */
import { API_BASE_URL, apiRequest } from "./httpClient";

const walletQuery = (path, wallet) => `${path}?wallet=${encodeURIComponent(wallet)}`;

export function getWalletBalance(wallet) {
  return apiRequest(walletQuery("/api/wallet/balance", wallet));
}

export function createMandate(mandate, signature) {
  return apiRequest("/api/mandates", { body: { mandate, signature } });
}

export function getMandates(wallet) {
  return apiRequest(walletQuery("/api/mandates", wallet));
}

export function deleteMandate(mandateId) {
  return apiRequest(`/api/mandates/${encodeURIComponent(mandateId)}`, { method: "DELETE" });
}

export function getNotifications(wallet) {
  return apiRequest(walletQuery("/api/notifications", wallet));
}

export function getPBM(wallet) {
  return apiRequest(walletQuery("/api/pbm", wallet));
}

export function getAgents(wallet) {
  return apiRequest(walletQuery("/api/agents", wallet));
}

export function createAgent(payload, wallet) {
  return apiRequest(walletQuery("/api/agents", wallet), { body: payload });
}

export function revokeAgent(agentId) {
  return apiRequest(`/api/agents/${encodeURIComponent(agentId)}`, {
    method: "PATCH",
    body: { walletAccess: false },
  });
}

// 자연어 지시 실행 — 백엔드(AgentChatController)가 세션의 지갑으로 AgentExecutionClient를
// 통해 AI Agent(/agent/execute)를 대신 호출(HMAC 서명 등)하고 결과를 그대로 돌려준다.
// 프론트는 Agent와 직접 통신하지 않는다. wallet은 세션 인증에서 나오므로 안 보낸다.
// 응답: { status: "executed"|"pending_approval"|"rejected", reason?, workloadType?, txHash?, amount? }
export function sendAgentInstruction({ instruction, tokenId, mandateId }) {
  return apiRequest("/agent/chat", {
    body: { instruction, tokenId, mandateId },
  });
}

export function getPendingTasks(wallet) {
  return apiRequest(walletQuery("/api/tasks/pending", wallet));
}

export function approveTask(taskId) {
  return apiRequest(`/api/tasks/${encodeURIComponent(taskId)}/approve`, { method: "POST", body: {} });
}

export function rejectTask(taskId) {
  return apiRequest(`/api/tasks/${encodeURIComponent(taskId)}/reject`, { method: "POST", body: {} });
}

// 백엔드팀 확정: /api/transactions, /api/projects, /api/dashboard를 따로 만들지 않고
// 이 하나(GET /api/users/{wallet}/payments)의 결제 이력을 프론트에서 화면별로 나눠 그린다.
// (거래내역 페이지 = 전체 목록, 내 프로젝트 페이지 = ACTIVATED/배포 관련 항목, 대시보드 = 집계)
export function getPayments(wallet) {
  return apiRequest(`/api/users/${encodeURIComponent(wallet)}/payments`);
}

// Agent가 결제 트랜잭션 전송 후 2초 간격으로 폴링하는 상태 조회.
// status: ACTIVATED | PENDING | WAITING_FOR_CONFIRMATION | REVERTED
export function getPaymentStatus(txHash) {
  return apiRequest(`/api/payments/${encodeURIComponent(txHash)}/status`);
}

// Kept as a compatibility export for SettingsPage and existing deployments.
export { API_BASE_URL as AGENT_BASE_URL };
