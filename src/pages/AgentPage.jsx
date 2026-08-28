import { useState, useEffect } from "react";
import CreateAgentModal from "../components/CreateAgentModal";
import AgentAvatar from "../components/AgentAvatar";
import { MandateCard } from "./PolicyListPage";
import { getVendor } from "../data/vendorOptions";
import { mockLogs } from "../data/mockData";
import { sendAgentInstruction } from "../api/agentClient";
import { apiRequest } from "../api/httpClient"; 
// logs prop이 없으면(단독 렌더 등) mockLogs로 대체

function fmt(n) {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString("ko-KR") : n || "-";
}

const ONBOARD_STEPS = [
  { n: 1, title: "Agent 지갑 연결", desc: "이 명령을 Agent에게 보내면 지갑 연결을 자동으로 준비합니다.", prompt: "Connect PBM wallet 0x8189...7F7D to this agent" },
  { n: 2, title: "지갑 접근 권한 위임", desc: "설정 중 Agent가 승인 요청 URL을 보내드립니다. 아직 안 왔다면 이 명령을 보내세요.", prompt: "Please authorize this agent to use my PBM mandate" },
  { n: 3, title: "테스트 배포 요청", desc: "Agent가 결제가 필요한 작업을 만나면 예산을 요청합니다. 간단한 테스트 배포로 확인해보세요.", prompt: "Deploy a test image-generation API using my PBM mandate" },
];

function CopyRow({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F4F6F8", borderRadius: 10, padding: "10px 12px" }}>
      <span style={{ flex: 1, fontSize: 12, fontFamily: "monospace", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
      <button onClick={handleCopy} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #E4E6E8", background: "#fff", fontSize: 11.5, fontWeight: 700, color: "#666", cursor: "pointer", flexShrink: 0 }}>
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}

function downloadMandateBillsCSV(logs) {
  const header = ["date", "project", "vendor", "amount_krwc", "status"];
  const rows = logs.map((l) => [l.dateLabel, l.project, l.vendor, l.amount, l.status]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mandate_bills.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function OnboardingAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", borderRadius: 16, marginBottom: 16, overflow: "hidden" }}>
      <div onClick={() => setOpen((v) => !v)} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
        <i className={`ti ${open ? "ti-chevron-down" : "ti-chevron-right"}`} style={{ fontSize: 14, color: "#999" }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>지갑에 Agent 연결하기</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb" }}>Agent 백엔드 연동 전 안내 (mock)</span>
      </div>
      {open && (
        <div style={{ padding: "0 20px 20px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14 }}>
          {ONBOARD_STEPS.map((s) => (
            <div key={s.n} style={{ background: "#F8F9FA", borderRadius: 14, padding: "16px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#111", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "#999", lineHeight: 1.5, marginBottom: 10 }}>{s.desc}</div>
              <CopyRow text={s.prompt} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentListItem({ agent, onClick }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFD")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", cursor: "pointer", transition: "background 0.15s" }}
    >
      <AgentAvatar seed={agent.agentId || agent.id} size={40} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>{agent.name}</div>
        <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>사용액: {agent.spent.toFixed(2)} KRWC</div>
      </div>
      <i className="ti ti-chevron-right" style={{ fontSize: 15, color: "#ccc" }} />
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #F0F0F0", marginBottom: 18 }}>
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <div
            key={t.key}
            onClick={() => onChange(t.key)}
            onMouseEnter={(e) => { if (!on) e.currentTarget.style.color = "#555"; }}
            onMouseLeave={(e) => { if (!on) e.currentTarget.style.color = "#aaa"; }}
            style={{ padding: "10px 4px", marginRight: 22, fontSize: 13.5, fontWeight: 700, color: on ? "#111" : "#aaa", borderBottom: on ? "2px solid #111" : "2px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "color 0.15s" }}
          >
            {t.label}
            {t.badge > 0 && (
              <span style={{ background: "#E02020", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 99, padding: "1px 6px" }}>{t.badge}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PendingTaskCard({ task, onApprove, onReject }) {
  const v = getVendor(task.vendor);
  const isGlyph = typeof v?.icon === "string" && v.icon.startsWith("ti-");
  const overBy = task.amount - task.autoApproveLimit;
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: "20px 22px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: v?.bg, color: v?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
          {isGlyph ? <i className={`ti ${v.icon}`} /> : v?.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 3 }}>{task.instruction}</div>
          <div style={{ fontSize: 11, color: "#bbb" }}>{task.requestedAt} 요청 · {v?.label}</div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F0F0FF", color: "#6B4EFF", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "4px 10px", flexShrink: 0 }}>
          <i className="ti ti-clock-hour-4" />승인 대기
        </span>
      </div>
      <div style={{ background: "#F8F9FA", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
          <span style={{ color: "#999" }}>요청 금액</span>
          <span style={{ fontWeight: 800, color: "#111" }}>{fmt(task.amount)} KRWC</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
          <span style={{ color: "#999" }}>Mandate 자율승인 한도</span>
          <span style={{ fontWeight: 700, color: "#555" }}>{fmt(task.autoApproveLimit)} KRWC</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderTop: "1px solid #EDEDED", marginTop: 4, paddingTop: 8 }}>
          <span style={{ color: "#E02020", fontWeight: 700 }}>한도 초과분</span>
          <span style={{ fontWeight: 800, color: "#E02020" }}>+{fmt(overBy)} KRWC</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onReject(task.id)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid #F0F0F0", background: "#fff", color: "#888", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>거부</button>
        <button onClick={() => onApprove(task.id)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: "#3182F6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>승인하고 실행</button>
      </div>
    </div>
  );
}



function Spinner({ size = 14, color = "#C87800", trackColor = "#FFD8A8" }) {
  return (
    <>
      <style>{`
        @keyframes pbm-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <span
        style={{
          width: size,
          height: size,
          border: `2px solid ${trackColor}`,
          borderTopColor: color,
          borderRadius: "50%",
          animation: "pbm-spin 0.8s linear infinite",
          flexShrink: 0,
          display: "inline-block",
        }}
      />
    </>
  );
}

const STATUS_LABEL = {
  executed: { text: "실행 완료", bg: "#E8FAF3", color: "#00A064" },
  pending_approval: { text: "승인 대기 전환", bg: "#FFF5E0", color: "#C87800" },
  rejected: { text: "거부됨", bg: "#FFF0F0", color: "#E02020" },
  confirming: { text: "확인 중", bg: "#FFF5E0", color: "#C87800" },
  ACTIVATED: { text: "결제 완료", bg: "#E8FAF3", color: "#00A064" },
  REVERTED: { text: "거부됨", bg: "#FFF0F0", color: "#E02020" },
  TIMEOUT: { text: "확인 지연", bg: "#F0F0F0", color: "#888" },
};

// ── 지시 채팅 패널 ──
// 사용자가 자연어로 "이러이러한 걸 만들어서 배포했어, 결제해줘"라고 보내면
// 백엔드(POST /agent/chat, AgentChatController)가 세션 지갑으로 AI Agent의
// /agent/execute를 대신 호출하고 결과(executed/pending_approval/rejected)를 돌려준다.
// ── 지시 채팅 패널 ──
// 사용자가 자연어로 "이러이러한 걸 만들어서 배포했어, 결제해줘"라고 보내면
// 백엔드(POST /agent/chat, AgentChatController)가 세션 지갑으로 AI Agent의
// /agent/execute를 대신 호출하고 결과(executed/pending_approval/rejected)를 돌려준다.
//
// 다만 executed는 "온체인에 트랜잭션을 제출했다"는 뜻일 뿐, 그 트랜잭션이
// 실제로 성공했는지는 아니다 (Agent가 Mandate/PBM 정책 위반으로 revert되는
// 트랜잭션도 일단 "제출"에는 성공할 수 있음). 그래서 txHash가 오면 곧바로
// 결과를 확정 짓지 않고, 백엔드가 온체인에서 직접 재검증한 결과
// (GET /api/payments/{txHash}/status)를 폴링해서 최종 상태로 화면을 갱신한다.
function InstructionChatPanel({ tokenId, mandates }) {
  const [mandateId, setMandateId] = useState(mandates[0]?.id ?? "");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);

  const canSend = text.trim().length > 0 && !sending && Number.isFinite(Number(tokenId));

  async function pollPaymentStatus(txHash, { maxAttempts = 20, intervalMs = 3000 } = {}) {
  const FINAL_STATUSES = ["ACTIVATED", "REVERTED"];  // 확정된 상태만 명시

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const status = await apiRequest(`/api/payments/${txHash}/status`);
      if (FINAL_STATUSES.includes(status?.status)) {
        return status;
      }
      // WAITING_FOR_CONFIRMATION, PENDING 등은 전부 "아직 진행 중"으로 취급하고 계속 재시도
    } catch (err) {
      console.log("[DEBUG] 폴링 에러:", err);
    }
  }
  return { status: "TIMEOUT" };
}

  const handleSend = async () => {
    const instruction = text.trim();
    if (!instruction || sending) return;

    const userMsg = { id: `u_${Date.now()}`, role: "user", text: instruction };
    setMessages((prev) => [...prev, userMsg]);
    setText("");
    setSending(true);

    const agentMsgId = `a_${Date.now()}`;

    try {
      const result = await sendAgentInstruction({ instruction, tokenId: Number(tokenId), mandateId: mandateId || null });
      console.log("[DEBUG] result 전체:", result);  

      if (result?.txHash) {
        // 아직 확정 전 — "확인 중"으로 먼저 보여준다.
        setMessages((prev) => [
          ...prev,
          { id: agentMsgId, role: "agent", result: { ...result, status: "confirming" } },
        ]);

        const finalStatus = await pollPaymentStatus(result.txHash);
        console.log("[DEBUG] 폴링 완료, 최종 상태:", finalStatus);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? { ...m, result: { ...result, ...finalStatus } }
              : m
          )
        );
      } else {
        // txHash가 없는 경우(사전 거부 등)는 바로 확정 상태로 표시
        setMessages((prev) => [...prev, { id: agentMsgId, role: "agent", result }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { id: agentMsgId, role: "agent", error: err.message || "요청에 실패했습니다." }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: 18, overflow: "hidden" }}>
      {!Number.isFinite(Number(tokenId)) && (
        <div style={{ padding: "12px 18px", background: "#FFF5E0", color: "#C87800", fontSize: 12, fontWeight: 700 }}>
          <i className="ti ti-alert-triangle" style={{ marginRight: 6 }} />
          PBM tokenId를 아직 못 불러왔습니다. 지갑/PBM 조회가 끝난 뒤에 보낼 수 있어요.
        </div>
      )}

      <div style={{ padding: "16px 18px", minHeight: 220, maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", color: "#bbb", fontSize: 12.5 }}>
            <i className="ti ti-message-2" style={{ fontSize: 24, color: "#ddd", display: "block", marginBottom: 8 }} />
            예: "이미지 생성 사이트를 만들어서 배포했어, 결제해줘"
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} style={{ alignSelf: "flex-end", maxWidth: "78%", background: "#111", color: "#fff", borderRadius: "14px 14px 4px 14px", padding: "10px 14px", fontSize: 13, lineHeight: 1.5 }}>
              {m.text}
            </div>
          ) : (
            <div key={m.id} style={{ alignSelf: "flex-start", maxWidth: "82%", background: "#F8F9FA", borderRadius: "4px 14px 14px 14px", padding: "12px 14px" }}>
              {m.error ? (
                <div style={{ fontSize: 12.5, color: "#E02020", fontWeight: 700 }}>
                  <i className="ti ti-x" style={{ marginRight: 4 }} />
                  {m.error}
                </div>
              ) : (
                <>
                 {(() => {
  if (m.result?.status === "confirming") {
    return <ConfirmingIndicator />;
  }
  const s = STATUS_LABEL[m.result?.status];
  return s ? (
    <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 800, borderRadius: 99, padding: "3px 10px", letterSpacing: "0.3px", background: s.bg, color: s.color, marginBottom: 8 }}>
      {s.text}
    </span>
  ) : null;
})()}
                  {m.result?.reason && (
                    <div style={{ fontSize: 12.5, color: "#666", marginBottom: 4 }}>{m.result.reason}</div>
                  )}
                  {m.result?.errorName && (
                    <div style={{ fontSize: 12.5, color: "#E02020", marginBottom: 4 }}>사유: {m.result.errorName}</div>
                  )}
                  {m.result?.workloadType && (
                    <div style={{ fontSize: 11.5, color: "#999" }}>워크로드: {m.result.workloadType}</div>
                  )}
                  {m.result?.amount && (
                    <div style={{ fontSize: 11.5, color: "#999" }}>금액: {m.result.amount} KRWC</div>
                  )}
                  {m.result?.serviceUrl && (
                    <div style={{ fontSize: 12, marginTop: 6 }}>
                      <a href={m.result.serviceUrl} target="_blank" rel="noreferrer" style={{ color: "#3182F6", fontWeight: 700 }}>
                        배포된 서비스 열기 → {m.result.serviceUrl}
                      </a>
                    </div>
                  )}
                  {m.result?.txHash && (
                    <div style={{ fontSize: 11, color: "#999", fontFamily: "monospace", marginTop: 4, wordBreak: "break-all" }}>
                      tx: {m.result.txHash}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        )}

        {sending && (
  <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#bbb" }}>
    <Spinner size={12} color="#999" trackColor="#E4E6E8" />
    Agent가 처리 중...
  </div>
)}
      </div>

      <div style={{ borderTop: "1px solid #F0F0F0", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {mandates.length > 0 && (
          <select
            value={mandateId}
            onChange={(e) => setMandateId(e.target.value)}
            style={{ alignSelf: "flex-start", fontSize: 11.5, color: "#888", border: "1px solid #E4E6E8", borderRadius: 8, padding: "4px 8px", background: "#fff" }}
          >
            {mandates.map((m) => (
              <option key={m.id} value={m.id}>Mandate: {m.name || m.id}</option>
            ))}
          </select>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 포트폴리오 사이트 만들어서 배포했어, 결제해줘"
            rows={2}
            style={{ flex: 1, resize: "none", border: "1.5px solid #F0F0F0", borderRadius: 12, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{ padding: "12px 18px", borderRadius: 12, border: "none", background: canSend ? "#3182F6" : "#E4E6E8", color: "#fff", fontSize: 13, fontWeight: 700, cursor: canSend ? "pointer" : "not-allowed", flexShrink: 0 }}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Agent 상세 화면 ──
function AgentDetail({ agent, mandates, pendingTasks, logs = mockLogs, tokenId, onBack, onDeleteMandate, onApproveTask, onRejectTask, onRevoke, onDelete }) {
  const [tab, setTab] = useState("chat");
  const tabs = [
    { key: "chat", label: "채팅" },
    { key: "mandates", label: "권한 목록" },
    { key: "activity", label: "활동 내역" },
    { key: "pending", label: "승인 대기", badge: pendingTasks.length },
    { key: "settings", label: "설정" },
  ];

  return (
    <div>
      <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#888", cursor: "pointer", marginBottom: 16 }}>
        <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
        연결된 Agent
      </div>

      <div style={{ background: "#fff", borderRadius: 18, padding: "20px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <AgentAvatar seed={agent.agentId || agent.id} size={52} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 3 }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace" }}>Agent ID {agent.agentId}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#bbb" }}>누적 사용액</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>{agent.spent.toFixed(2)} KRWC</div>
        </div>
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "chat" && (
        <InstructionChatPanel tokenId={tokenId} mandates={mandates} />
      )}

      {tab === "mandates" && (
        mandates.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 18, padding: "48px 20px", textAlign: "center", color: "#bbb" }}>
            <i className="ti ti-file-off" style={{ fontSize: 28, color: "#ddd" }} />
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10, color: "#888" }}>이 Agent에 위임된 Mandate가 없습니다.</div>
          </div>
        ) : (
          mandates.map((m) => <MandateCard key={m.id} mandate={m} onDelete={onDeleteMandate} />)
        )
      )}

      {tab === "pending" && (
        pendingTasks.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 18, padding: "48px 20px", textAlign: "center", color: "#bbb" }}>
            <i className="ti ti-circle-check" style={{ fontSize: 28, color: "#ddd" }} />
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10, color: "#888" }}>승인 대기 중인 작업이 없습니다.</div>
          </div>
        ) : (
          pendingTasks.map((t) => <PendingTaskCard key={t.id} task={t} onApprove={onApproveTask} onReject={onRejectTask} />)
        )
      )}

      {tab === "activity" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 2 }}>내보내기</div>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>모든 Mandate의 결제 내역을 CSV로 내려받습니다.</div>
            <button onClick={() => downloadMandateBillsCSV(logs)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none", background: "#111", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <i className="ti ti-download" />
              CSV 다운로드
            </button>
          </div>

          <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 10 }}>최근 활동</div>
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden" }}>
            {logs.map((log, i) => (
              <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderBottom: i < logs.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{log.project}</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{log.dateLabel} {log.time}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{log.amount.toFixed(2)} KRWC</span>
                <span style={{
                  fontSize: 10, fontWeight: 800, borderRadius: 99, padding: "3px 10px", letterSpacing: "0.3px",
                  background: log.status === "done" ? "#E8FAF3" : log.status === "fail" ? "#FFF0F0" : "#FFF5E0",
                  color: log.status === "done" ? "#00A064" : log.status === "fail" ? "#E02020" : "#C87800",
                }}>
                  {log.status === "done" ? "SUCCESS" : log.status === "fail" ? "FAILED" : "PENDING"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 14 }}>일반</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F5F5F5" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>지갑 접근 권한</div>
                <div style={{ fontSize: 11.5, color: "#999", marginTop: 2 }}>이 Agent는 위임된 Mandate 범위 안에서 결제를 실행할 수 있습니다.</div>
              </div>
              <button onClick={onRevoke} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#FFF0F0", color: "#E02020", fontSize: 12.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                권한 철회
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Agent 삭제</div>
                <div style={{ fontSize: 11.5, color: "#999", marginTop: 2 }}>이 Agent와 관련 데이터를 영구적으로 삭제합니다.</div>
              </div>
              <button onClick={onDelete} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#E02020", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                삭제
              </button>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 14 }}>Agent ID</div>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>Agent ID</div>
            <div style={{ fontSize: 12.5, fontFamily: "monospace", color: "#555", marginBottom: 14 }}>{agent.agentId}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11.5, color: "#999", maxWidth: 320 }}>새 토큰을 발급하면 기존 토큰은 즉시 무효화됩니다.</div>
              <button style={{ padding: "9px 16px", borderRadius: 10, border: "1.5px solid #F0F0F0", background: "#fff", color: "#555", fontSize: 12.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                토큰 재발급
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentPage({ agents, mandates, pendingTasks, logs = mockLogs, tokenId, onCreateAgent, onDeleteAgent, onRevokeAgent, onDeleteMandate, onApproveTask, onRejectTask }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const selectedAgent = agents.find((a) => a.id === selectedId);

  if (selectedAgent) {
    return (
      <div style={{ padding: "36px 48px", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
        <AgentDetail
          agent={selectedAgent}
          mandates={mandates}
          pendingTasks={pendingTasks}
          logs={logs}
          tokenId={tokenId}
          onBack={() => setSelectedId(null)}
          onDeleteMandate={onDeleteMandate}
          onApproveTask={onApproveTask}
          onRejectTask={onRejectTask}
          onRevoke={() => onRevokeAgent(selectedAgent.id)}
          onDelete={() => { onDeleteAgent(selectedAgent.id); setSelectedId(null); }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 48px", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      <div style={{ marginBottom: 4, paddingRight: 50 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.5px", marginBottom: 4 }}>AI Agent</div>
        <div style={{ fontSize: 13, color: "#bbb", marginBottom: 20 }}>내 지갑에 접근 권한을 가진 Agent를 관리하세요.</div>
      </div>

      <OnboardingAccordion />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>연결된 Agent</span>
        <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", border: "none", borderRadius: 10, background: "#111", fontSize: 12.5, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
          <i className="ti ti-plus" style={{ fontSize: 13 }} />
          Agent 만들기
        </button>
      </div>

      {agents.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 18, padding: "48px 20px", textAlign: "center", color: "#bbb" }}>
          <i className="ti ti-robot-off" style={{ fontSize: 28, color: "#ddd" }} />
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10, color: "#888" }}>연결된 Agent가 없습니다.</div>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden" }}>
          {agents.map((a, i) => (
            <div key={a.id} style={{ borderBottom: i < agents.length - 1 ? "1px solid #F5F5F5" : "none" }}>
              <AgentListItem agent={a} onClick={() => setSelectedId(a.id)} />
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAgentModal
          onCancel={() => setShowCreate(false)}
          onCreate={(form) => { onCreateAgent(form); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
const CONFIRMING_MESSAGES = [
  "블록체인에서 결제를 확인하고 있어요...",
  "정부 정책(PBM)과 부합하는지 검증 중이에요...",
  "위임 조건(Mandate)을 확인하고 있어요...",
  "온체인 트랜잭션이 확정되기를 기다리는 중이에요...",
];

function ConfirmingIndicator() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % CONFIRMING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Spinner />
      <span style={{ fontSize: 12.5, color: "#C87800", fontWeight: 600 }}>
        {CONFIRMING_MESSAGES[msgIndex]}
      </span>
    </div>
  );
}