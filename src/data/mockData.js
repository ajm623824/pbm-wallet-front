// ============================================================
// 지갑(연결된 MetaMask 계정) — 백엔드 GET /api/wallet/balance 로 대체될 값
// ============================================================
export const mockWallet = {
  address: "0x2D01...95d2",
  network: "Base Sepolia",
  token: "KRWC",
};

// ============================================================
// PBM — 정부(NIPA)가 발급한 클라우드 인프라 바우처.
// ⚠️ 사용자가 직접 수정할 수 없는 값. 화면에는 항상 "읽기전용"으로만 노출한다.
// Mandate(아래)는 이 안(allowedVendors)에서만 벤더를 선택할 수 있고,
// 이수진에게 배정된 tokenId=2는 Cloudflare 결제 1건 후 280,000 KRWC가 남아 있다.
// ============================================================
export const mockPBM = {
  tokenId: "2",
  programName: "청년 이사 지원금",
  issuer: "국토교통부",
  totalBudget: 300000, // KRWC — tokenId=2 최초 할당액
  usedBudget: 20000, // KRWC — Cloudflare 결제 1건 반영
  expiresAt: "2026-12-31",
  allowedVendors: ["cloudflare"], // 새 Mandate의 온체인 allowedVendors
  status: "active",
};

// ============================================================
// AI Agent — 지갑에 접근 권한을 부여한 Agent 아이덴티티 (FluxA 스타일 모형)
// Agent 실제 개발 전이라 mock 데이터로만 존재. 클릭하면 이 Agent에 딸린
// Mandate/Activity/Settings를 볼 수 있다.
// ============================================================
export const mockAgents = [
  {
    id: "agent_1",
    name: "리소스 구매 AI",
    agentId: "8f2a41c6-9d3b-4e17-a205-6b8f21d4c9e0",
    walletAccess: true,
    spent: 3200, // Cloudflare 결제 1건 반영(KRWC)
  },
];

// ============================================================
// Mandate — 사용자(이수진)가 AI Agent에게 위임하는 정책.
// PBM 화이트리스트의 부분집합 + 예산 + 실행 기간/자율승인 한도.
// MandateForm(정책 설정 화면)에서 생성 → 승인 목록에 쌓인다.
// ============================================================
export const mockMandates = [
  {
    id: "mnd_1",
    name: "이미지 생성 AI 배포용 위임",
    status: "active", // active | pending_signature | expired | revoked
    createdAt: "2026-06-18",
    agentAddress: "0x8a91...e6C2",
    selectedVendors: ["cloudflare"], // 온체인 allowedVendors와 동일
    totalBudget: 300000, // KRWC — tokenId=2 최초 할당액
    maxPerTx: 30000, // KRWC, 1회 결제 최대 금액
    dailyLimit: 30000, // KRWC, 일일 지출 한도
    autoApproveLimit: 30000, // KRWC, 이 금액 이하는 Agent가 자율 승인
    delegationValue: 24,
    delegationUnit: "hour", // "hour" | "day"
    delegationExpiresAt: "2026-06-19 14:32",
  },
];

// ============================================================
// 내 프로젝트 — Agent가 배포까지 완료(혹은 진행 중)한 API/AI 목록
// 시나리오: 상품 사진을 직접 찍기 어려운 소상공인이 AI로 상품 이미지를 만들고,
// 배경 제거·업스케일까지 자동화하려는 설정
// ============================================================
export const mockProjects = [
  {
    id: "prj_1",
    name: "이미지 생성 AI 배포",
    vendor: "cloudflare",
    status: "activated", // deploying | activated | failed
    url: "https://image-gen-ai-x1.workers.dev",
    deployedAt: "2026-06-18 14:32",
    mandateId: "mnd_1",
  },
  {
    id: "prj_2",
    name: "배경 제거 AI",
    vendor: "kt_cloud",
    status: "deploying",
    url: null,
    deployedAt: null,
    mandateId: "mnd_1",
  },
  {
    id: "prj_3",
    name: "고해상도 업스케일 AI",
    vendor: "cloudflare",
    status: "failed",
    url: null,
    deployedAt: null,
    mandateId: "mnd_1",
    failReasonCode: "DEPLOY_FAILED",
  },
];

// ============================================================
// 승인 대기 — Mandate의 자율승인 임계값(autoApproveLimit)을 초과해서
// Agent가 자율 실행하지 못하고 사용자 확인을 기다리는 작업
// ============================================================
export const mockPendingTasks = [
  {
    id: "task_1",
    instruction: "고해상도 이미지 업스케일 AI를 클라우드에 배포해줘",
    vendor: "kt_cloud",
    amount: 40, // KRWC
    mandateId: "mnd_1",
    autoApproveLimit: 30, // KRWC
    requestedAt: "2026-06-19 10:12",
  },
];

// ============================================================
// 실패 사유 코드 — PBM(정부) 위반 / Mandate(위임) 위반 / 프로토콜 위반을 구분
// ============================================================
export const FAILURE_REASON_MAP = {
  PBM_VENDOR_NOT_WHITELISTED: "PBM 화이트리스트(정부 발급)에 없는 클라우드 벤더입니다",
  PBM_LIMIT_EXCEEDED: "요청 금액이 PBM 총 한도(정부 발급)를 초과합니다",
  PBM_EXPIRED: "PBM 바우처 유효기간이 만료되었습니다",
  MANDATE_VENDOR_NOT_SELECTED: "위임(Mandate)에서 선택하지 않은 벤더로의 요청입니다",
  MANDATE_LIMIT_EXCEEDED: "요청 금액이 위임(Mandate)에 설정된 1회 결제 한도를 초과합니다",
  MANDATE_EXPIRED: "위임(Mandate) 유효기간이 만료되었습니다",
  AGENT_NOT_DELEGATED: "이 Agent 주소는 위임된 Agent가 아닙니다",
  NO_USAGE_PROOF: "클라우드 사용량 증빙이 확인되지 않아 결제가 보류되었습니다",
  DEPLOY_FAILED: "배포에 실패했습니다",
  JWT_INVALID: "서명 검증에 실패했습니다",
  NONCE_REUSED: "Nonce 재사용이 감지되었습니다",
  UNKNOWN: "알 수 없는 오류가 발생했습니다",
};

export const mockStats = {
  today: { total: 5, success: 3, blocked: 1, progress: 1, pending: 0 },
  weekly: { total: 24, success: 18, blocked: 3, progress: 2, pending: 1 },
};

export const mockNotifications = [
  { id: 1, type: "done", time: "14:32", msg: "이미지 생성 AI 배포 — Cloudflare 배포 완료" },
  { id: 2, type: "fail", time: "13:55", msg: "AWS 요청 차단됨 (화이트리스트 외)" },
  { id: 3, type: "done", time: "11:40", msg: "배경 제거 AI — Mandate 검증 통과" },
];

export const mockWeeklyData = { counts: [2, 4, 3, 6, 1, 5, 3] };

// ============================================================
// 거래 내역 타임라인 — 지시 접수 → 벤더 선택 → pay() → PBM+Mandate 이중검증
//   → KRWC 결제 → webhook 감지 → Cloudflare 배포 → URL 반환/대시보드 표시
// ============================================================
const STEPS_DONE = (vendorLabel, amount, reqId, txHash, mandateId, url, balanceBefore, balanceAfter, ts) => [
  {
    status: "ok", ts: `${ts}:01`,
    label: "작업 지시 접수",
    desc: "AI Agent가 클라우드 배포 지시를 수신했습니다",
    meta: [
      { k: "지시 내용", v: "이미지 생성 AI를 클라우드에 배포해줘" },
      { k: "Agent 주소", v: "0x8a91...e6C2" },
      { k: "상태", v: "접수 완료", color: "green" },
    ],
  },
  {
    status: "ok", ts: `${ts}:04`,
    label: "벤더 선택 · 결제 요청",
    desc: `벤더 비교 후 ${vendorLabel} 선택 — pay() 컨트랙트 호출`,
    meta: [
      { k: "선택 벤더", v: vendorLabel },
      { k: "요청 금액", v: `${amount} KRWC` },
      { k: "함수 호출", v: "pay(tokenId, vendorAddress, amount)" },
    ],
  },
  {
    status: "ok", ts: `${ts}:05`,
    label: "이중 검증 통과 (PBM + Mandate)",
    desc: "정부 화이트리스트/총한도 확인 · 위임된 Agent·자율승인한도 확인",
    meta: [
      { k: "PBM 검증", v: "통과 (화이트리스트·총한도 이내)", color: "green" },
      { k: "Mandate 검증", v: `통과 (${mandateId})`, color: "green" },
    ],
  },
  {
    status: "ok", ts: `${ts}:06`,
    label: "KRWC 결제 완료",
    desc: "PBM 토큰 소각 · 온체인 KRWC 이체 실행",
    meta: [
      { k: "tx hash", v: txHash },
      { k: "처리 후 PBM 잔액", v: `${balanceAfter} KRWC` },
      { k: "응답 코드", v: "200 OK", color: "green" },
    ],
  },
  {
    status: "ok", ts: `${ts}:08`,
    label: "클라우드 배포",
    desc: "Alchemy Webhook으로 이체 이벤트 감지 → 배포 실행",
    meta: [
      { k: "감지 경로", v: "POST /webhook/alchemy" },
      { k: "사용량 증빙", v: "확인됨", color: "green" },
    ],
  },
  {
    status: "ok", ts: `${ts}:10`,
    label: "배포 완료",
    desc: "API URL 발급 · 대시보드/내 프로젝트에 반영",
    meta: [
      { k: "API URL", v: url },
      { k: "총 소요 시간", v: "9.8s" },
      { k: "최종 상태", v: "배포 완료", color: "green" },
    ],
  },
];

const STEPS_PROGRESS = (vendorLabel, amount, mandateId, ts) => [
  {
    status: "ok", ts: `${ts}:22`,
    label: "작업 지시 접수",
    desc: "AI Agent가 클라우드 배포 지시를 수신했습니다",
    meta: [
      { k: "지시 내용", v: "배경 제거 AI를 클라우드에 배포해줘" },
      { k: "Agent 주소", v: "0x8a91...e6C2" },
      { k: "상태", v: "접수 완료", color: "green" },
    ],
  },
  {
    status: "ok", ts: `${ts}:24`,
    label: "벤더 선택 · 결제 요청",
    desc: `${vendorLabel} 선택 — pay() 컨트랙트 호출`,
    meta: [{ k: "요청 금액", v: `${amount} KRWC` }, { k: "Mandate ID", v: mandateId }],
  },
  {
    status: "progress", ts: `${ts}:25`,
    label: "이중 검증 중",
    desc: "PBM 화이트리스트/총한도 확인 중입니다",
    meta: [
      { k: "PBM 검증", v: "통과", color: "green" },
      { k: "Mandate 검증", v: "확인 중...", color: "progress" },
    ],
  },
  { status: "wait", label: "KRWC 결제 완료" },
  { status: "wait", label: "클라우드 배포" },
  { status: "wait", label: "배포 완료" },
];

const STEPS_FAIL_WHITELIST = (vendorLabel, amount, mandateId, ts) => [
  {
    status: "ok", ts: `${ts}:10`,
    label: "작업 지시 접수",
    desc: "AI Agent가 클라우드 배포 지시를 수신했습니다",
    meta: [{ k: "지시 내용", v: "고해상도 업스케일 AI를 AWS에 배포해줘" }, { k: "Agent 주소", v: "0x8a91...e6C2" }],
  },
  {
    status: "ok", ts: `${ts}:11`,
    label: "벤더 선택 · 결제 요청",
    desc: `${vendorLabel} 선택 — pay() 컨트랙트 호출`,
    meta: [{ k: "요청 금액", v: `${amount} KRWC` }, { k: "Mandate ID", v: mandateId }],
  },
  {
    status: "fail", ts: `${ts}:12`,
    label: "PBM 정책 위반 · 차단",
    desc: "정부 화이트리스트에 없는 벤더로의 요청입니다",
    meta: [
      { k: "PBM 화이트리스트", v: "Cloudflare, KT Cloud, 네이버클라우드" },
      { k: "요청 벤더", v: `${vendorLabel} (목록 외)`, color: "red" },
      { k: "응답 코드", v: "403 Forbidden", color: "red" },
      { k: "차단 사유 코드", v: "PBM_VENDOR_NOT_WHITELISTED" },
    ],
    reason: FAILURE_REASON_MAP.PBM_VENDOR_NOT_WHITELISTED,
  },
  { status: "wait", label: "KRWC 결제 완료" },
  { status: "wait", label: "클라우드 배포" },
  { status: "wait", label: "배포 완료" },
];

const STEPS_FAIL_LIMIT = (vendorLabel, amount, mandateId, maxPerTx, ts) => [
  {
    status: "ok", ts: `${ts}:05`,
    label: "작업 지시 접수",
    desc: "AI Agent가 클라우드 배포 지시를 수신했습니다",
    meta: [{ k: "지시 내용", v: "대량 이미지 일괄생성 AI를 배포해줘" }, { k: "Agent 주소", v: "0x8a91...e6C2" }],
  },
  {
    status: "ok", ts: `${ts}:06`,
    label: "벤더 선택 · 결제 요청",
    desc: `${vendorLabel} 선택 — pay() 컨트랙트 호출`,
    meta: [{ k: "요청 금액", v: `${amount} KRWC` }, { k: "Mandate ID", v: mandateId }],
  },
  {
    status: "fail", ts: `${ts}:07`,
    label: "Mandate 정책 위반 · 차단",
    desc: "요청 금액이 위임(Mandate)에 설정된 1회 결제 한도를 초과합니다",
    meta: [
      { k: "PBM 검증", v: "통과 (화이트리스트 이내)", color: "green" },
      { k: "1회 결제 한도(Mandate)", v: `${maxPerTx.toLocaleString()} KRWC` },
      { k: "요청 금액", v: `${amount.toLocaleString()} KRWC (한도 초과)`, color: "red" },
      { k: "응답 코드", v: "403 Forbidden", color: "red" },
      { k: "차단 사유 코드", v: "MANDATE_LIMIT_EXCEEDED" },
    ],
    reason: FAILURE_REASON_MAP.MANDATE_LIMIT_EXCEEDED,
  },
  { status: "wait", label: "KRWC 결제 완료" },
  { status: "wait", label: "클라우드 배포" },
  { status: "wait", label: "배포 완료" },
];

export const mockLogs = [
  {
    id: 1, project: "이미지 생성 AI 배포", vendor: "cloudflare", amount: -42.0, time: "14:32",
    dateLabel: "6월 18일 목요일", status: "done",
    summary: { reqId: "req_9f3a2c", balanceAfter: "320.00", elapsed: "9.8s" },
    steps: STEPS_DONE("Cloudflare", 42, "req_9f3a2c", "0x7f3a...4f56", "mnd_1", "image-gen-ai-x1.workers.dev", "362.00", "320.00", "14:32"),
  },
  {
    id: 2, project: "배경 제거 AI", vendor: "kt_cloud", amount: -35.0, time: "15:10",
    dateLabel: "6월 18일 목요일", status: "progress",
    summary: { reqId: "req_2b7d4e", balanceCurrent: "320.00", elapsed: "3.4s..." },
    steps: STEPS_PROGRESS("KT Cloud", 35, "mnd_1", "15:10"),
  },
  {
    id: 3, project: "고해상도 업스케일 AI", vendor: "aws", amount: -80.0, time: "13:55",
    dateLabel: "6월 17일 수요일", status: "fail",
    reason_code: "PBM_VENDOR_NOT_WHITELISTED",
    summary: { reqId: "req_5c1f8a", blockStage: "PBM 정책 검증", blockCode: "403" },
    steps: STEPS_FAIL_WHITELIST("AWS", 80, "mnd_1", "13:55"),
  },
  {
    id: 4, project: "대량 이미지 일괄생성 AI", vendor: "cloudflare", amount: -600.0, time: "12:20",
    dateLabel: "6월 17일 수요일", status: "fail",
    reason_code: "MANDATE_LIMIT_EXCEEDED",
    summary: { reqId: "req_7e3b9d", blockStage: "Mandate 검증", blockCode: "403" },
    steps: STEPS_FAIL_LIMIT("Cloudflare", 600, "mnd_1", 50, "12:20"),
  },
];
