import { useEffect, useRef, useState } from "react";
import { mockPBM, mockLogs, mockWeeklyData } from "../data/mockData";
import { getVendor } from "../data/vendorOptions";
import Timeline from "../components/Timeline";
import RefreshStatus from "../components/RefreshStatus";
import { loadHiddenLogIds } from "../utils/hiddenIds";

const STATUS = {
  done: { bg: "#E8FAF3", color: "#00A064", label: "배포 완료" },
  progress: { bg: "#FFF5E0", color: "#C87800", label: "진행중" },
  fail: { bg: "#FFF0F0", color: "#E02020", label: "차단" },
};

// 벤더별 누적 사용액(성공 건만) — 벤더 사용 비중 도넛에 사용
function calcVendorUsage(logs) {
  const usage = {};
  logs.forEach((log) => {
    if (log.status !== "done") return;
    usage[log.vendor] = (usage[log.vendor] || 0) + Math.abs(log.amount);
  });
  return usage;
}

// 배포 요청 상태 분포 — logs(성공/진행중/차단)를 직접 세고, 승인대기만 pendingTasks 개수로.
// mock 로그도 섞여있는 채로 계산되는 게 의도(=mock 없으면 화면이 휑해짐).
function statusDistribution(logs, pendingCount) {
  const success = logs.filter((l) => l.status === "done").length;
  const progress = logs.filter((l) => l.status === "progress").length;
  const blocked = logs.filter((l) => l.status === "fail").length;
  return [
    { key: "success", label: "배포 성공", value: success, color: "#00A064" },
    { key: "progress", label: "진행중", value: progress, color: "#C87800" },
    { key: "blocked", label: "배포 차단", value: blocked, color: "#E02020" },
    { key: "pending", label: "승인 대기", value: pendingCount, color: "#6B4EFF" },
  ].filter((s) => s.value > 0);
}

// mock 주간 카운트(7일치) + 실제 결제 로그(_source==="api")의 날짜별 카운트를 더한다.
// mock은 그대로 유지 — 화면이 휑해지지 않게 — 하고, 그 위에 실 데이터가 쌓이는 구조.
function buildWeeklyCounts(logs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const realCounts = new Array(7).fill(0);
  logs.forEach((log) => {
    if (log._source !== "api" || !log.createdAt) return;
    const d = new Date(log.createdAt);
    if (Number.isNaN(d.getTime())) return;
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - d) / 86400000); // 오늘=0, 어제=1, ...
    const idx = 6 - diffDays; // mockWeeklyData.counts와 같은 인덱스 규칙(0=6일 전 ... 6=오늘)
    if (idx >= 0 && idx <= 6) realCounts[idx] += 1;
  });
  return mockWeeklyData.counts.map((v, i) => v + realCounts[i]);
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: accent + "1A", color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
          <i className={`ti ${icon}`} />
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#999" }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#111", letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#bbb", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// 심플 도넛 차트 — 세그먼트 배열([{value,color}])을 받아 링 형태로 그림
function Donut({ segments, size = 132, thickness = 18, centerLabel, centerSub }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F4F6F8" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * circ;
          const preceding = segments.slice(0, i).reduce((sum, segment) => sum + segment.value, 0);
          const rotate = (preceding / total) * 360 - 90;
          return (
            <circle
              key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              transform={`rotate(${rotate} ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dasharray 0.3s" }}
            />
          );
        })}
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 19, fontWeight: 900, color: "#111", lineHeight: 1 }}>{centerLabel}</div>
        {centerSub && <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>{centerSub}</div>}
      </div>
    </div>
  );
}

function DonutLegend({ items, valueSuffix = "" }) {
  const total = items.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0 }}>
      {items.map((s) => (
        <div key={s.key || s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "#555", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#111" }}>{s.value}{valueSuffix}</span>
          <span style={{ fontSize: 11, color: "#bbb", minWidth: 32, textAlign: "right" }}>{Math.round((s.value / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ logs }) {
  const canvasRef = useRef(null);
  const weeklyCounts = buildWeeklyCounts(logs);
  const weeklyTotal = weeklyCounts.reduce((a, v) => a + v, 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = 180;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const data = weeklyCounts;
    const maxV = Math.max(...data, 1);
    const today = new Date();
    const labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - (6 - i));
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const pL = 30, pR = 12, pT = 14, pB = 26, w = W - pL - pR, h = H - pT - pB;
    const xS = (i) => pL + (i / (data.length - 1)) * w;
    const yS = (v) => pT + h - (v / maxV) * h;

    ctx.strokeStyle = "rgba(0,0,0,0.05)"; ctx.lineWidth = 1;
    const gridSteps = 4;
    for (let g = 0; g <= gridSteps; g++) {
      const v = (maxV / gridSteps) * g;
      ctx.beginPath(); ctx.moveTo(pL, yS(v)); ctx.lineTo(pL + w, yS(v)); ctx.stroke();
      ctx.fillStyle = "#ccc"; ctx.font = "10px -apple-system,sans-serif"; ctx.textAlign = "right";
      ctx.fillText(Math.round(v), pL - 6, yS(v) + 3);
    }
    ctx.textAlign = "center";
    labels.forEach((l, i) => ctx.fillText(l, xS(i), H - 6));

    ctx.beginPath();
    data.forEach((v, i) => (i === 0 ? ctx.moveTo(xS(i), yS(v)) : ctx.lineTo(xS(i), yS(v))));
    ctx.lineTo(xS(data.length - 1), H - pB); ctx.lineTo(xS(0), H - pB); ctx.closePath();
    const grad = ctx.createLinearGradient(0, pT, 0, H - pB);
    grad.addColorStop(0, "rgba(49,130,246,0.16)"); grad.addColorStop(1, "rgba(49,130,246,0.01)");
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath(); ctx.strokeStyle = "#3182F6"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
    data.forEach((v, i) => (i === 0 ? ctx.moveTo(xS(i), yS(v)) : ctx.lineTo(xS(i), yS(v))));
    ctx.stroke();
    data.forEach((v, i) => {
      ctx.beginPath(); ctx.arc(xS(i), yS(v), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#3182F6"; ctx.lineWidth = 2.5; ctx.stroke();
    });
  }, [weeklyCounts.join(",")]);

  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: "22px 24px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>최근 7일 배포 요청 건수</div>
        <div style={{ fontSize: 11, color: "#bbb" }}>이번 주 총 {weeklyTotal}건</div>
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", height: 180, display: "block" }} />
    </div>
  );
}

export default function DashboardPage({ pbm = mockPBM, logs: rawLogs = mockLogs, pendingTasks = [], onNavigateLogs, onRefresh }) {
  const [logExpanded, setLogExpanded] = useState(null);
  // 개발자 모드에서 숨긴 결제 로그는 대시보드 전체(최근 활동/차트/도넛/성공률)에서도 일관되게 제외
  const hiddenLogIds = loadHiddenLogIds();
  const logs = rawLogs.filter((l) => !hiddenLogIds.has(l.id));
  const TOTAL = pbm.totalBudget;
  const USED = pbm.usedBudget;
  const REMAINING = TOTAL - USED;
  const USED_PCT = TOTAL > 0 ? Math.round((USED / TOTAL) * 100) : 0;
  const vendorUsage = calcVendorUsage(logs);
  const vendorSegments = Object.entries(vendorUsage).map(([key, value]) => {
    const v = getVendor(key);
    return { key, label: v?.label || key, value, color: v?.bg && v.bg !== "#fff" ? v.bg : v?.color || "#888" };
  });
  const statusSegments = statusDistribution(logs, pendingTasks.length);
  const successCount = logs.filter((l) => l.status === "done").length;
  const totalCount = logs.length + pendingTasks.length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;
  const recentLogs = logs.slice(0, 4);

  return (
    <div style={{ padding: "36px 48px", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      <RefreshStatus title="대시보드" onRefresh={onRefresh} />

      {/* ── 핵심 지표 4개 ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
        <StatCard icon="ti-building-bank" accent="#3182F6" label="정부 지원 총 한도" value={`${TOTAL} KRWC`} sub={pbm.programName} />
        <StatCard icon="ti-credit-card" accent="#C87800" label="사용 금액" value={`${USED} KRWC`} sub={`총 한도의 ${USED_PCT}% 사용`} />
        <StatCard icon="ti-wallet" accent="#00A064" label="남은 금액" value={`${REMAINING} KRWC`} sub={`총 한도의 ${100 - USED_PCT}% 남음`} />
        <StatCard icon="ti-checkbox" accent="#6B4EFF" label="성공률" value={`${successRate}%`} sub={`${successCount}/${totalCount}건 성공`} />
      </div>

      {/* ── 라인 차트 ── */}
      <ChartCard logs={logs} />

      {/* ── 도넛 2개: 벤더별 사용 비중 / 배포 상태 분포 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: "22px 24px", display: "flex", alignItems: "center", gap: 24 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 16 }}>벤더별 사용 비중</div>
            <Donut segments={vendorSegments} centerLabel={`${USED}`} centerSub="KRWC 사용" />
          </div>
          <DonutLegend items={vendorSegments} valueSuffix=" KRWC" />
        </div>
        <div style={{ background: "#fff", borderRadius: 18, padding: "22px 24px", display: "flex", alignItems: "center", gap: 24 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 16 }}>배포 상태 분포</div>
            <Donut segments={statusSegments} centerLabel={totalCount} centerSub="전체 요청" />
          </div>
          <DonutLegend items={statusSegments} valueSuffix="건" />
        </div>
      </div>

      {/* ── 최근 결제 로그 (요약) ── */}
      <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", marginBottom: 40 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>최근 활동</span>
          {onNavigateLogs && (
            <button
              onClick={onNavigateLogs}
              style={{ fontSize: 12, fontWeight: 700, color: "#3182F6", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
            >
              전체 로그 보기 <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
            </button>
          )}
        </div>
        {recentLogs.map((log, i) => {
          const s = STATUS[log.status];
          const isExp = logExpanded === log.id;
          return (
            <div key={log.id}>
              <div onClick={() => setLogExpanded(isExp ? null : log.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 20px", borderBottom: !isExp && i < recentLogs.length - 1 ? "1px solid #F5F5F5" : "none", cursor: "pointer" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.project}</span>
                <span style={{ fontSize: 10.5, color: "#999", background: "#F4F6F8", borderRadius: 6, padding: "2px 7px", flexShrink: 0 }}>{getVendor(log.vendor)?.label || log.vendor}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#111", minWidth: 78, textAlign: "right", flexShrink: 0 }}>{log.amount.toFixed(2)} KRWC</span>
                <span style={{ fontSize: 10, color: "#bbb", minWidth: 34, textAlign: "right", flexShrink: 0 }}>{log.time}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, minWidth: 56, justifyContent: "center", flexShrink: 0 }}>
                  {log.status === "fail" && <i className="ti ti-alert-triangle" />}
                  {s.label}
                </span>
                <i className="ti ti-chevron-down" style={{ fontSize: 12, color: "#ccc", transition: "transform 0.2s", transform: isExp ? "rotate(180deg)" : "none", flexShrink: 0 }} />
              </div>
              {isExp && (
                <div style={{ background: "#FAFBFD", borderBottom: i < recentLogs.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                  <Timeline steps={log.steps} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
