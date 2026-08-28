// ============================================================
// 백엔드 확정 사항: /api/transactions, /api/projects, /api/dashboard를 따로
// 만들지 않고 GET /api/users/{wallet}/payments 하나(결제 이력)를 프론트에서
// 거래내역/내프로젝트/대시보드 세 화면에 맞게 나눠 그린다.
//
// 이 파일은 그 결제 이력 원본(payment)을 각 화면이 기대하는 mock 데이터
// 형태(mockLogs / mockProjects 모양)로 변환한다. 실제 payment는 mock 항목과
// id 체계가 겹치지 않아(txHash 기반) 그대로 이어붙이면 mock은 지워지지 않고
// 그 위에 실 데이터가 "추가"되는 형태가 된다.
//
// 이번 시나리오는 온체인 실결제가 Cloudflare로만 확정되어 있어서(README 참고),
// 백엔드 응답에 vendor 필드가 없어도 실 payment는 전부 Cloudflare로 고정한다.
// 나중에 벤더가 늘어나면 여기 한 곳(REAL_PAYMENT_VENDOR)만 바꾸면 된다.
// ============================================================

const REAL_PAYMENT_VENDOR = "cloudflare";

// 파일 상단, 기존 함수들 위에 추가
const ERROR_NAME_KO = {
  VendorNotAllowedByMandate: "허용되지 않은 클라우드로 결제를 시도했습니다.",
  MerchantNotWhitelisted: "정부(PBM)가 승인한 클라우드 벤더 목록에 없는 곳으로 결제가 시도되었습니다.",
  AutoLimitExceededError: "위임된 건당 결제 한도를 초과했습니다.",
  BudgetExceeded: "PBM에 남은 예산을 초과하는 금액이 요청되었습니다.",
  MandateExpired: "Agent에게 부여된 위임 기간이 만료되었습니다.",
  NotApprovedAgent: "이 지갑이 승인하지 않은 Agent가 결제를 시도했습니다.",
};

const LAYER_LABEL_KO = {
  MANDATE: "개인 위임 (Mandate)",
  PBM: "정부 정책 (PBM)",
};

function describeErrorKo(errorName) {
  return ERROR_NAME_KO[errorName] || "결제 조건 검증에 실패했습니다.";
}

function shortenAddress(addr) {
  if (typeof addr !== "string" || addr.length < 10) return addr || "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// REVERTED + failedLayer/errorName/failReasonCode → 화면에 쓰는 fail_reason 코드로 매핑.
// 백엔드가 이미 mockData.js의 FAILURE_REASON_MAP 코드 체계에 맞춰 failReasonCode를
// 내려주기로 했으므로(문서 5번 항목 참고) 있으면 그대로 쓰고, 없으면 errorName을 대체로 쓴다.
function resolveReasonCode(payment) {
  return payment.failReasonCode || payment.errorName || "UNKNOWN";
}

function toLogStatus(result) {
  if (result === "ACTIVATED") return "done";
  if (result === "REVERTED") return "fail";
  return "progress"; // PENDING | WAITING_FOR_CONFIRMATION
}

function toProjectStatus(result) {
  if (result === "ACTIVATED") return "activated";
  if (result === "REVERTED") return "failed";
  return "deploying";
}

function formatDateLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toTimeString().slice(0, 5);
}

// TxLogPage/DashboardPage/AgentPage/WalletPage가 기대하는 "log" 모양으로 변환.
// 상세 펼침에서 쓰는 steps는 실 데이터엔 6단계 세부 이력이 없어서, 있는 필드
// (txHash, 이중검증 결과, serviceUrl 등)만으로 단순화한 타임라인을 만든다.
export function paymentToLog(payment) {
  const vendor = REAL_PAYMENT_VENDOR;
  const amount = Number(payment.amount) || 0;
  const status = toLogStatus(payment.result);
  const ts = formatTime(payment.createdAt);

  const steps = [
    {
      status: "ok",
      ts,
      label: "결제 요청",
      desc: payment.purpose || "Agent 결제 요청",
      meta: [
        { k: "TxHash", v: payment.txHash, mono: true },
        { k: "요청 금액", v: `${amount} KRWC` },
      ],
    },
    payment.result === "REVERTED"
      ? {
          status: "fail",
          ts,
          label: `정책 위반 · 차단 `,
          desc: describeErrorKo(payment.errorName),
          meta: [
            { k: "거부된 레이어", v: LAYER_LABEL_KO[payment.failedLayer] || payment.failedLayer || "-", color: "red" },
            { k: "시도한 수취인", v: shortenAddress(payment.payee), mono: true },
            { k: "요청 금액", v: `${amount} KRWC`, color: "red" },
          ],
          reason: describeErrorKo(payment.errorName),
        }
      : {
          status: payment.result === "ACTIVATED" ? "ok" : "progress",
          ts,
          label: "결제 검증",
          desc: payment.result === "ACTIVATED" ? "검증 통과 · KRWC 결제 완료" : "온체인 확정 대기 중",
          meta: [{ k: "상태", v: "결제 완료", color: payment.result === "ACTIVATED" ? "green" : "progress" }],
        },
    payment.result === "ACTIVATED"
      ? {
          status: "ok",
          ts,
          label: "배포 완료",
          desc: "클라우드 배포 URL이 발급되었습니다",
          meta: [{ k: "웹사이트 주소", v: payment.serviceUrl || "-" }],
        }
      : { status: payment.result === "REVERTED" ? "wait" : "progress", label: "클라우드 배포" },
  ];

  return {
    id: payment.txHash,
    project: payment.purpose || "결제 요청",
    vendor,
    amount: -amount,
    time: ts,
    dateLabel: formatDateLabel(payment.createdAt),
    createdAt: payment.createdAt,
    status,
    reason_code: payment.result === "REVERTED" ? resolveReasonCode(payment) : undefined,
    summary:
      status === "done"
        ? { reqId: shortenAddress(payment.txHash), balanceAfter: "-", elapsed: "-" }
        : status === "progress"
        ? { reqId: shortenAddress(payment.txHash), balanceCurrent: "-", elapsed: "-" }
        : { reqId: shortenAddress(payment.txHash), blockStage: payment.failedLayer || "-", blockCode: "403" },
    steps,
    _source: "api",
  };
}

// MyProjectPage가 기대하는 "project" 모양으로 변환.
export function paymentToProject(payment) {
  return {
    id: `pay_${payment.txHash}`,
    name: payment.purpose || "배포 요청",
    vendor: REAL_PAYMENT_VENDOR,
    status: toProjectStatus(payment.result),
    url: payment.serviceUrl || null,
    deployedAt: payment.result === "ACTIVATED" ? formatDateLabel(payment.createdAt) + " " + formatTime(payment.createdAt) : null,
    _deployedAtRaw: payment.result === "ACTIVATED" ? payment.createdAt : null, // 정렬용 원본 타임스탬프(한글 포맷은 Date로 못 읽어서 별도 보관)
    amount: Number(payment.amount) || 0,
    // 백엔드가 아직 결제 응답에 mandateId/agentId를 안 내려줘서 지금은 항상 null.
    // 나중에 응답에 포함되면 자동으로 잡혀서 Mandate/Agent 상세 화면에 연결된다.
    mandateId: payment.mandateId || null,
    agentId: payment.agentId || null,
    failReasonCode: payment.result === "REVERTED" ? resolveReasonCode(payment) : undefined,
    _source: "api",
  };
}

// 서버 결제 이력 배열 → 화면별 배열. mock 배열 뒤에 이어붙여 쓰면 mock은 남고
// 실 데이터가 추가되는 형태가 된다. 같은 txHash가 이미 있으면(재조회) 중복을 걸러낸다.
export function buildLogsFromPayments(payments, existingIds = new Set()) {
  if (!Array.isArray(payments)) return [];
  return payments.filter((p) => p?.txHash && !existingIds.has(p.txHash)).map(paymentToLog);
}

export function buildProjectsFromPayments(payments, existingIds = new Set()) {
  if (!Array.isArray(payments)) return [];
  return payments
    .filter((p) => p?.txHash && !existingIds.has(`pay_${p.txHash}`))
    .map(paymentToProject);
}
