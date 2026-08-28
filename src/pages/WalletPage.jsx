import { useState } from "react";
import AgentAvatar from "../components/AgentAvatar";
import RefreshStatus from "../components/RefreshStatus";
import { mockLogs } from "../data/mockData";
import { getVendor } from "../data/vendorOptions";
import { FAILURE_REASON_MAP } from "../data/mockData";
import { loadHiddenLogIds } from "../utils/hiddenIds";

// chainId → 네트워크 이름 (기술적 세부정보라 지금은 "지갑 정보 보기"에만 노출)
const CHAIN_NAMES = {
  1: "Ethereum Mainnet",
  5: "Goerli Testnet",
  11155111: "Sepolia Testnet",
  84532: "Base Sepolia",
  8453: "Base Mainnet",
  137: "Polygon",
};

function formatExpiryDate(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function daysUntil(isoString) {
  if (!isoString) return null;
  const target = new Date(isoString);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function WalletPage({
  walletAddress,
  tokenBalance,
  tokenSymbol = "KRWC",
  chainId,
  agents = [],
  logs: rawLogs = mockLogs,
  onRefresh,
  isAuthenticated = false,
  pbm = null,
  holderName = "이수진",           // 실제 로그인 사용자 이름을 App.jsx에서 내려주면 그대로 대체됨
  onNavigateToAgent,                // App.jsx에서 () => setPage("agent") 형태로 연결 필요
}) {
  const [warnMode, setWarnMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showGrantDetails, setShowGrantDetails] = useState(false);  

  const hiddenLogIds = loadHiddenLogIds();
  const logs = rawLogs.filter((l) => !hiddenLogIds.has(l.id));

  const networkName = chainId ? (CHAIN_NAMES[chainId] || `Chain #${chainId}`) : "-";

  const metaMaskConnected = isAuthenticated && Boolean(walletAddress);
  const agentDelegated = agents.some((a) => a.walletAccess);
  const pbmMandateActive = Boolean(pbm);
  const statusChecks = [
    { label: "✓  정부 지원 조건 적용 중", ok: metaMaskConnected },
    { label: "✓  내가 설정한 AI 사용 권한 적용 중", ok: agentDelegated },
    { label: "✓  AI Agent가 허용된 범위에서만 사용 중", ok: pbmMandateActive },
  ];
  const allOk = statusChecks.every((c) => c.ok);
  const lastLog = logs[0];
  const lastCheckedLabel = lastLog ? `${lastLog.dateLabel} ${lastLog.time} 기준` : "최근 활동 없음";

  const violations = logs.filter((l) => l.status === "fail");

  const totalBudget = pbm?.totalBudget ?? 0;
  const usedBudget = pbm?.usedBudget ?? 0;
  const remaining = Math.max(totalBudget - usedBudget, 0);
  const percentRemaining = totalBudget > 0 ? Math.round((remaining / totalBudget) * 100) : 0;
  const dday = daysUntil(pbm?.expiresAt);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try { await onRefresh?.(); } finally { setRefreshing(false); }
  };

  // 결제 로그 한 줄을 "AI가 한 일" 헤드라인으로 변환
  function activityHeadline(tx) {
    const v = getVendor(tx.vendor);
    if (tx.status === "done") return `배포 완료 — ${v?.label || tx.vendor}`;
    if (tx.status === "fail") return `결제가 거부됐어요 — ${FAILURE_REASON_MAP[tx.reason_code] || "정책 위반"}`;
    return "AI가 처리하고 있어요";
  }

  return (
    <div style={{ padding: "36px 48px", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      <RefreshStatus title="정부 소상공인 AI·클라우드 바우처" onRefresh={onRefresh} />

      {/* ① 정체성 배지 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <img
          src="/ICT.png"
          alt="정부 지원 사업"
          style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{holderName}님의 AI·클라우드 바우처</div>
          <div style={{ fontSize: 11.5, color: "#999" }}>
            소상공인의 AX를 위한 정부 지원사업
          </div>
        </div>
      </div>

      {/* ② 잔액 + 규칙 통합 카드 */}
      {!pbm ? (
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 26px", textAlign: "center", color: "#bbb", marginBottom: 14 }}>
          지원금 정보를 불러오는 중입니다...
        </div>
      ) : (
        <div style={{ background: "#1B3A6B", borderRadius: 20, padding: "22px 26px", color: "#fff", marginBottom: 14, position: "relative" }}>
   {/* 정부 사업 인증 배지 카드 */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.12)", borderRadius: 12,
              padding: "10px 14px", marginBottom: 16,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🏛</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800 }}>
                  정부 지원사업 · 과학기술정보통신부 · AI·클라우드 바우처
                </div>
                <div style={{ fontSize: 10.5, opacity: 0.7, marginTop: 2 }}>
                  소상공인 AI·디지털 전환 지원 (본 서비스가 가정한 정부 지원사업)
                </div>
              </div>
            </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600,color: "#7FD858" }}>사용 가능 금액</div>
            
          </div>

          <div style={{fontSize: 32, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1, marginBottom: 4 }}>
            {Math.round(remaining).toLocaleString("ko-KR")}
            <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.85, marginLeft: 6 }}>KRWC</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 14 }}>
            총 {Math.round(totalBudget).toLocaleString("ko-KR")} KRWC 중
          </div>

          {/* 프로그레스 바 */}
          <div style={{ height: 8, background: "rgba(255,255,255,0.25)", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${percentRemaining}%`, background: "#fff", borderRadius: 99, transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 18 }}>{percentRemaining}% 남음</div>

          {/* 지원 목적 / 사용 목적 — 분리해서 표시 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, opacity: 0.7, fontWeight: 600, marginBottom: 4 }}>지원 목적</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>소상공인 AI·디지털 전환 지원</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, opacity: 0.7, fontWeight: 600, marginBottom: 4 }}>사용 가능 분야</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>AI 서비스 · 클라우드 서비스</div>
              </div>
            </div>

          {/* 허용 업체 */}
          {pbm.allowedVendors?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {pbm.allowedVendors.map((key) => {
                const v = getVendor(key);
                return (
                  <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.18)", borderRadius: 99, padding: "5px 11px", fontSize: 11.5, fontWeight: 700 }}>
                    <i style={{ fontSize: 11 }} />
                   🟢 {v?.label || key}
                  </span>
                );
              })}
            </div>
          )}

          {/* 만료일 */}
          <div style={{ fontSize: 12, opacity: 0.85, display: "flex", alignItems: "center", gap: 5 }}>
            <i className="ti ti-clock" style={{fontSize: 13 }} />
            유효기간: {formatExpiryDate(pbm.expiresAt)}까지 {dday != null && `(D-${dday})`}
          </div>
          

          {/* 지원금 상세 — 지갑 정보 보기 위에 별도 섹션으로 추가 */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
              <div
                onClick={() => setShowGrantDetails((v) => !v)}
                style={{ fontSize: 11, opacity: 0.75, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <i className={`ti ${showGrantDetails ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ fontSize: 11 }} />
                지원금 상세
              </div>
                            {showGrantDetails && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                    <span style={{ opacity: 0.65 }}>지원 기관</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                      과학기술정보통신부
                      <img
                        src="/ICT.png"
                        alt="과학기술정보통신부"
                        style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                    </span>
                  </div>
                  {[
                    ["지원 대상", "소상공인"],
                    ["지원 목적", "AI·디지털 전환"],
                    ["지원 금액", `${Math.round(totalBudget).toLocaleString("ko-KR")}원`],
                    ["사용 가능 분야", "AI 서비스 · 클라우드 서비스"],
                    ["사용 기간", "2026.09.01 ~ 2027.02.17"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                      <span style={{ opacity: 0.65 }}>{label}</span>
                      <span style={{ fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 기술 세부정보 접기/펼치기 — 기존 그대로 */}
            <div style={{ marginTop: 12, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
              <div
                onClick={() => setShowDetails((v) => !v)}
                style={{ fontSize: 11, opacity: 0.75, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <i className={`ti ${showDetails ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ fontSize: 11 }} />
                지갑 정보 보기
              </div>
              {showDetails && (
                <div style={{ marginTop: 8, fontSize: 11, opacity: 0.75, fontFamily: "monospace", lineHeight: 1.8 }}>
                  <div>지갑 주소: {walletAddress || "-"}</div>
                  <div>온체인 실제 잔액: {tokenBalance ?? "—"} {tokenSymbol}</div>
                </div>
              )}
            </div>
            </div>
      )}

      <button
  onClick={onNavigateToAgent}
  style={{ width: "100%", background: "#FF6B4A", color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", cursor: "pointer", marginBottom: 14 }}
>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>
    <i className="ti ti-robot" style={{ fontSize: 17 }} />
    AI 비서에게 업무 맡기기
  </div>
  <div style={{ fontSize: 10.5, opacity: 0.65, fontWeight: 500 }}>
  여러분들의 자금 사용을 스마트 AI 비서가 도와드립니다
  </div>
</button>

      {/* ④ 상태 요약 */}
      <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
        <button onClick={() => setWarnMode(false)} style={{ flex: 1, padding: 6, borderRadius: 8, border: warnMode ? "1px solid #ddd" : "1px solid #3182F6", background: warnMode ? "#fff" : "#EAF2FF", fontSize: 11, fontWeight: 700, color: warnMode ? "#666" : "#3182F6", cursor: "pointer" }}>정상 이용 중</button>
        <button onClick={() => setWarnMode(true)} style={{ flex: 1, padding: 6, borderRadius: 8, border: warnMode ? "1px solid #E02020" : "1px solid #ddd", background: warnMode ? "#FFF0F0" : "#fff", fontSize: 11, fontWeight: 700, color: warnMode ? "#E02020" : "#666", cursor: "pointer" }}>차단 내역</button>
      </div>

      {!warnMode ? (
        <div style={{ background: allOk ? "#F0FBF5" : "#FFFBEB", border: `1px solid ${allOk ? "#C8EEDD" : "#F5E1A8"}`, borderRadius: 14, padding: "13px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <i className={`ti ${allOk ? "ti-circle-check" : "ti-alert-triangle"}`} style={{ color: allOk ? "#00A064" : "#C87800", fontSize: 15 }} />
            {allOk ? "안전하게 지원금을 사용하고 있어요" : "확인이 필요한 항목이 있습니다"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {statusChecks.map((c) => (
              <div key={c.label} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, color: c.ok ? "#00A064" : "#C87800" }}>
                <i className={`ti ${c.ok ? "ti-point-filled" : "ti-point"}`} style={{ fontSize: 10 }} />{c.label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#bbb", marginTop: 7 }}>최근 확인: {lastCheckedLabel}</div>
        </div>
      ) : violations.length === 0 ? (
        <div style={{ background: "#F0FBF5", border: "1px solid #C8EEDD", borderRadius: 14, padding: "13px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-circle-check" style={{ color: "#00A064", fontSize: 15 }} />
            차단된 요청이 없어요
          </div>
        </div>
      ) : (
        <div style={{ background: "#FFF5F5", border: "1px solid #F7C1C1", borderRadius: 14, padding: "13px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-alert-triangle" style={{ color: "#E02020", fontSize: 15 }} />
            AI가 시도했지만 막힌 요청 {violations.length}건
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {violations.slice(0, 3).map((v) => (
              <div key={v.id} style={{ background: "#fff", borderRadius: 10, padding: "9px 12px", border: "1px solid #F7C1C1" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{v.project}"</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FFF0F0", color: "#E02020", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "3px 9px" }}>
                  <i className="ti ti-ban" />{FAILURE_REASON_MAP[v.reason_code] || "정책 위반"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⑤ 최근 활동 + ⑥ 연결된 AI 비서 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 10 }}>최근 우리 AI가 한 일</div>
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden" }}>
            {logs.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#ccc", fontSize: 13 }}>아직 활동이 없어요</div>
            ) : logs.slice(0, 4).map((tx, i) => (
              <div key={tx.id} style={{ padding: "14px 16px", borderBottom: i < 3 ? "1px solid #F5F5F5" : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx.status === "fail" ? "#E02020" : "#111", marginBottom: 3 }}>
                  {tx.status === "done" && <i className="ti ti-circle-check" style={{ color: "#00A064", marginRight: 5 }} />}
                  {tx.status === "fail" && <i className="ti ti-ban" style={{ color: "#E02020", marginRight: 5 }} />}
                  {activityHeadline(tx)}
                </div>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{tx.project}"</div>
                <div style={{ fontSize: 11, color: "#ccc" }}>{tx.dateLabel} {tx.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 10 }}>연결된 AI 비서</div>
          <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden" }}>
            {agents.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#ccc", fontSize: 13 }}>연결된 AI 비서가 없어요</div>
            ) : agents.map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < agents.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                <AgentAvatar seed={a.agentId || a.id} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>사용액 {Math.round(a.spent).toLocaleString("ko-KR")} KRWC</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: a.walletAccess ? "#00A064" : "#E02020", background: a.walletAccess ? "#E8FAF3" : "#FFF0F0", borderRadius: 99, padding: "3px 9px", flexShrink: 0 }}>
                  {a.walletAccess ? "권한 있음" : "권한 철회됨"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`.spin{animation:spin 0.8s linear infinite}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}