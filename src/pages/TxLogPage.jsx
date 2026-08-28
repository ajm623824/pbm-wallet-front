import { useState } from "react";
import { mockLogs } from "../data/mockData";
import { getVendor } from "../data/vendorOptions";
import { loadHiddenLogIds, saveHiddenLogIds } from "../utils/hiddenIds";
// logs prop이 없으면(App 연동 전 단독 렌더 등) mockLogs로 대체
import Timeline from "../components/Timeline";
import RefreshStatus from "../components/RefreshStatus";

const FILTERS = [
  { key: "all", label: "전체", icon: null },
  { key: "done", label: "배포 완료", icon: "ti-check" },
  { key: "progress", label: "진행중", icon: "ti-loader" },
  { key: "fail", label: "차단", icon: "ti-ban" },
];

const STATUS = {
  done: { bg: "#E8FAF3", color: "#00A064", icon: "ti-check", label: "배포 완료" },
  progress: { bg: "#FFF5E0", color: "#C87800", icon: "ti-loader", label: "진행중" },
  fail: { bg: "#FFF0F0", color: "#E02020", icon: "ti-alert-triangle", label: "차단" },
};

// 백엔드가 failedLayer로 내려주는 값(MANDATE/PBM)을 한글로 표시하기 위한 매핑
const LAYER_LABEL_KO = {
  MANDATE: "개인 위임 (Mandate)",
  PBM: "정부 정책 (PBM)",
};

const TITLE_WIDTH = 420; // 제목 칸을 고정폭으로 둬서, 벤더 뱃지 위치가 제목 길이와 무관하게 항상 같은 자리에 오도록 함

// 요청 금액/PBM 잔액/요청ID/소요시간 4칸 요약줄.
function SummaryBar({ log }) {
  const s = log.summary;
  const cells = log.status === "done"
    ? [["요청 금액", `${Math.abs(log.amount).toFixed(2)} KRWC`, null],
       ["처리 후 PBM 잔액", `${s.balanceAfter} KRWC`, "green"],
       ["요청 ID", s.reqId, "mono"],
       ["소요 시간", s.elapsed, null]]
    : log.status === "progress"
    ? [["요청 금액", `${Math.abs(log.amount).toFixed(2)} KRWC`, null],
       ["현재 PBM 잔액", `${s.balanceCurrent} KRWC`, "blue"],
       ["요청 ID", s.reqId, "mono"],
       ["경과 시간", s.elapsed, null]]
    : [["요청 금액", `${Math.abs(log.amount).toFixed(2)} KRWC`, null],
       ["차단 레이어", LAYER_LABEL_KO[s.blockStage] || s.blockStage, "red"],
       ["요청 ID", s.reqId, "mono"],
       ["차단 코드", s.blockCode, "red"]];

  const COLOR = { green: "#00A064", red: "#E02020", blue: "#3182F6" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid #EDEEF0", background: "#F4F6F8" }}>
      {cells.map(([k, v, c], i) => (
        <div
          key={k}
          style={{
            padding: `12px ${i === cells.length - 1 ? 20 : 14}px 12px ${i === 0 ? 20 : 14}px`,
            borderRight: i < cells.length - 1 ? "1px solid #E4E7EB" : "none",
          }}
        >
          <div style={{ fontSize: 11.5, color: "#8A94A3", fontWeight: 800, letterSpacing: "0.3px", marginBottom: 4, textTransform: "uppercase" }}>{k}</div>
          <div style={{
            fontSize: 14,
            fontWeight: c === "mono" ? 700 : 800,
            color: c && c !== "mono" ? COLOR[c] : "#111",
            fontFamily: c === "mono" ? "monospace" : "inherit",
          }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export default function TxLogPage({ logs = mockLogs, onRefresh, devMode = false }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("desc"); // desc = 최신순(원본 순서), asc = 오래된순(뒤집기)
  const [hiddenIds, setHiddenIds] = useState(loadHiddenLogIds);

  const toggleHidden = (id) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveHiddenLogIds(next);
      return next;
    });
  };

  const visibleLogs = devMode ? logs : logs.filter((l) => !hiddenIds.has(l.id));
  const filteredByStatus = filter === "all" ? visibleLogs : visibleLogs.filter((l) => l.status === filter);
  const filteredBySearch = search.trim()
    ? filteredByStatus.filter((l) => l.project.toLowerCase().includes(search.trim().toLowerCase()))
    : filteredByStatus;
  const filtered = sortDir === "desc" ? filteredBySearch : [...filteredBySearch].reverse();

  const grouped = [];
  let lastDate = null;
  filtered.forEach((log) => {
    if (log.dateLabel !== lastDate) {
      grouped.push({ type: "date", label: log.dateLabel });
      lastDate = log.dateLabel;
    }
    grouped.push({ type: "log", log });
  });

  return (
    <div style={{ padding: "36px 48px", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      <RefreshStatus title="지원금 사용 내역" onRefresh={onRefresh} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 7 }}>
          {FILTERS.map(({ key, label, icon }) => {
            const on = filter === key;
            return (
              <button key={key} onClick={() => { setFilter(key); setExpanded(null); }} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 15px", borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: on ? "none" : "1.5px solid #EBEBEB",
                background: on ? "#3182F6" : "#fff",
                color: on ? "#fff" : "#aaa",
              }}>
                {icon && <i className={`ti ${icon}`} style={{ fontSize: 12.5 }} />}
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, border: "1.5px solid #F0F0F0", fontSize: 13, fontWeight: 700, background: "#fff", color: "#555", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            <i className="ti ti-arrows-sort" style={{ fontSize: 13.5 }} />
            {sortDir === "desc" ? "최신순" : "오래된순"}
          </button>
          <div style={{ position: "relative" }}>
            <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#bbb" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="서비스명 검색"
              style={{ padding: "8px 12px 8px 32px", borderRadius: 10, border: "1.5px solid #F0F0F0", fontSize: 13, background: "#fff", color: "#111", width: 180 }}
            />
          </div>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", color: "#ccc", fontSize: 14.5 }}>해당 내역이 없습니다</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {grouped.map((item, i) => {
            if (item.type === "date") return (
              <div key={`d-${i}`} style={{ padding: i === 0 ? "0 4px 2px" : "10px 4px 2px", fontSize: 12.5, fontWeight: 800, color: "#999", letterSpacing: "0.2px" }}>
                {item.label}
              </div>
            );
            const { log } = item;
            const s = STATUS[log.status];
            const v = getVendor(log.vendor);
            const isOpen = expanded === log.id;
            return (
              <div key={log.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: isOpen ? "1.5px solid #3182F6" : "1.5px solid #F0F0F0", opacity: devMode && hiddenIds.has(log.id) ? 0.45 : 1, transition: "border-color 0.15s, opacity 0.15s" }}>
                <div
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                  onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = "#FAFBFD"; }}
                  onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 22px", cursor: "pointer", transition: "background 0.15s", background: isOpen ? "#F5F9FF" : "transparent" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "5px 11px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color, flexShrink: 0, minWidth: 108 }}>
                    <i className={`ti ${s.icon}`} />{s.label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: `0 1 ${TITLE_WIDTH}px` }}>{log.project}</span>
                  <span style={{ fontSize: 12, color: "#bbb", background: "#F4F6F8", borderRadius: 6, padding: "3px 8px", flexShrink: 0 }}>{v?.label || log.vendor}</span>
                  <span style={{ flex: 1 }} />
                  {devMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleHidden(log.id); }}
                      title={hiddenIds.has(log.id) ? "사용자에게 다시 표시" : "사용자에게 숨기기"}
                      style={{ width: 26, height: 26, border: "1.5px solid #F0F0F0", borderRadius: 8, background: hiddenIds.has(log.id) ? "#FFF0F0" : "#fff", color: hiddenIds.has(log.id) ? "#E02020" : "#999", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >
                      <i className={`ti ${hiddenIds.has(log.id) ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 13 }} />
                    </button>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111", flexShrink: 0, minWidth: 90, textAlign: "right" }}>{log.amount.toFixed(2)} KRWC</span>
                  <span style={{ fontSize: 12, color: "#bbb", minWidth: 36, textAlign: "right", flexShrink: 0 }}>{log.time}</span>
                  <i className="ti ti-chevron-down" style={{ fontSize: 13, color: "#ccc", marginLeft: 2, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none", flexShrink: 0 }} />
                </div>

                {log.status === "progress" && (
                  <div style={{ height: 2, background: "#F0F0F0", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "#F5A623", width: "50%" }} />
                  </div>
                )}

                {isOpen && (
                  <div style={{ background: "#FAFBFD", borderTop: "1px solid #F5F5F5" }}>
                    <SummaryBar log={log} />
                    <Timeline steps={log.steps} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}