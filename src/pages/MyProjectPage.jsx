import { useState, Fragment } from "react";
import { getVendor } from "../data/vendorOptions";
import { FAILURE_REASON_MAP } from "../data/mockData";
import { loadHiddenProjectIds, saveHiddenProjectIds } from "../utils/hiddenIds";

const STATUS_STYLE = {
  deploying: { bg: "#FFF5E0", color: "#C87800", icon: "ti-loader", label: "배포 중" },
  activated: { bg: "#E8FAF3", color: "#00A064", icon: "ti-circle-check", label: "배포 완료" },
  failed: { bg: "#FFF0F0", color: "#E02020", icon: "ti-alert-triangle", label: "배포 실패" },
};

const STATUS_FILTERS = [
  { key: "all", label: "전체 상태" },
  { key: "activated", label: "배포 완료" },
  { key: "deploying", label: "배포 중" },
  { key: "failed", label: "배포 실패" },
];

const TITLE_WIDTH = 480; // 제목을 고정폭으로 둬서 상태뱃지/눈아이콘/날짜가 행마다 다른 위치로 밀리지 않게 함

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

// ── 목록의 카드 한 줄 (클릭하면 상세 화면으로 이동) ──
function ServiceRow({ project, onOpen, devMode, hidden, onToggleHidden }) {
  const v = getVendor(project.vendor);
  const s = STATUS_STYLE[project.status];
  const isGlyph = typeof v?.icon === "string" && v.icon.startsWith("ti-");

  return (
    <div
      onClick={onOpen}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#FAFBFD"; e.currentTarget.style.borderColor = "#E4ECFB"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#F0F0F0"; }}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", cursor: "pointer",
        background: "#fff", border: "1.5px solid #F0F0F0", borderRadius: 16, opacity: devMode && hidden ? 0.45 : 1,
        transition: "background 0.15s, border-color 0.15s, opacity 0.15s",
      }}
    >
      <span style={{ width: 42, height: 42, borderRadius: 12, background: v?.bg, color: v?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
        {isGlyph ? <i className={`ti ${v.icon}`} /> : v?.icon}
      </span>
      <div style={{ flex: `0 1 ${TITLE_WIDTH}px`, minWidth: 0, fontSize: 14, fontWeight: 800, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {project.name}
      </div>
      <span style={{ flex: 1 }} />
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, background: s.bg, color: s.color, borderRadius: 99, fontSize: 10.5, fontWeight: 700, padding: "2px 9px", flexShrink: 0, minWidth: 96 }}>
        <i className={`ti ${s.icon}`} />{s.label}
      </span>
      {devMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleHidden(project.id); }}
          title={hidden ? "사용자에게 다시 표시" : "사용자에게 숨기기"}
          style={{ width: 26, height: 26, border: "1.5px solid #F0F0F0", borderRadius: 8, background: hidden ? "#FFF0F0" : "#fff", color: hidden ? "#E02020" : "#999", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <i className={`ti ${hidden ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 13 }} />
        </button>
      )}
      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 90 }}>
        <div style={{ fontSize: 10.5, color: "#bbb" }}>최종 배포일</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>{project.deployedAt || "-"}</div>
      </div>
      <i className="ti ti-chevron-right" style={{ fontSize: 15, color: "#ccc", flexShrink: 0 }} />
    </div>
  );
}

function DetailBox({ icon, label, children, full = false }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto", background: "#F8F9FA", border: "1px solid #F0F0F0", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "#bbb", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
        <i className={`ti ${icon}`} />{label}
      </div>
      {children}
    </div>
  );
}

// 배포 3단계 진행 스텝퍼 — 결제 요청 → 이중 검증(PBM+Mandate) → 배포 완료
// 상태값(deploying/activated/failed)만으로 각 단계가 어디까지 갔는지 표현.
function StatusStepper({ status, failReasonLabel }) {
  const steps =
    status === "activated"
      ? [{ label: "결제 요청", state: "done" }, { label: "이중 검증 (PBM+Mandate)", state: "done" }, { label: "배포 완료", state: "done" }]
      : status === "failed"
      ? [{ label: "결제 요청", state: "done" }, { label: "이중 검증 (PBM+Mandate)", state: "fail" }, { label: "배포 완료", state: "wait" }]
      : [{ label: "결제 요청", state: "done" }, { label: "이중 검증 (PBM+Mandate)", state: "progress" }, { label: "배포 완료", state: "wait" }];

  const ICON = { done: "ti-check", fail: "ti-x", progress: "ti-loader", wait: "ti-point" };
  const COLOR = { done: "#00A064", fail: "#E02020", progress: "#C87800", wait: "#ccc" };
  const BG = { done: "#E8FAF3", fail: "#FFF0F0", progress: "#FFF5E0", wait: "#F4F4F4" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        {steps.map((step, i) => (
          <Fragment key={step.label}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 130 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: BG[step.state], color: COLOR[step.state], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                <i className={`ti ${ICON[step.state]}`} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: step.state === "wait" ? "#bbb" : "#111", marginTop: 5, whiteSpace: "nowrap", textAlign: "center" }}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: steps[i + 1].state === "wait" ? "#EEE" : COLOR[step.state], marginBottom: 18 }} />
            )}
          </Fragment>
        ))}
      </div>
      {status === "failed" && failReasonLabel && (
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: "#E02020" }}>{failReasonLabel}</div>
      )}
    </div>
  );
}

// ── Agent 상세 화면과 같은 패턴: 별도 화면으로 전환되는 프로젝트 상세 카드 ──
function ProjectDetail({ project, agents = [], mandates = [], onBack }) {
  const v = getVendor(project.vendor);
  const s = STATUS_STYLE[project.status];
  const isGlyph = typeof v?.icon === "string" && v.icon.startsWith("ti-");
  const linkedMandate = project.mandateId ? mandates.find((m) => m.id === project.mandateId) : null;
  const linkedAgent = project.agentId ? agents.find((a) => a.id === project.agentId || a.agentId === project.agentId) : null;

  return (
    <div>
      <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#888", cursor: "pointer", marginBottom: 16 }}>
        <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
        배포한 서비스
      </div>

      <div style={{ background: "#fff", borderRadius: 18, padding: "20px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ width: 52, height: 52, borderRadius: 14, background: v?.bg, color: v?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
          {isGlyph ? <i className={`ti ${v.icon}`} /> : v?.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>{project.name}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#111" }}>{project.amount ? `${project.amount.toFixed(2)} KRWC` : "-"}</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, borderRadius: 99, fontSize: 11.5, fontWeight: 700, padding: "3px 11px", marginTop: 4 }}>
            <i className={`ti ${s.icon}`} />{s.label}
          </span>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 18, padding: "22px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* 상태 — 가로로 긴 3단계 스텝퍼, 맨 위 */}
          <DetailBox icon="ti-info-circle" label="상태" full>
            <StatusStepper
              status={project.status}
              failReasonLabel={project.status === "failed" ? (FAILURE_REASON_MAP[project.failReasonCode] || "배포에 실패했습니다.") : null}
            />
          </DetailBox>

          {/* URL */}
          {project.status === "activated" && project.url && (
            <DetailBox icon="ti-link" label="URL" full>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <a href={project.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#3182F6", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.url}</a>
                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(project.url); }} title="URL 복사" style={{ width: 22, height: 22, border: "none", background: "none", color: "#bbb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-copy" style={{ fontSize: 13 }} />
                </button>
              </div>
            </DetailBox>
          )}

          {/* 프로바이더 / 최종 배포일 */}
          <DetailBox icon="ti-cloud" label="프로바이더">
            <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{v?.label || project.vendor}</div>
          </DetailBox>

          <DetailBox icon="ti-calendar" label="최종 배포일">
            <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{project.deployedAt || "-"}</div>
          </DetailBox>

          {/* 연결된 Mandate / Agent — 값이 있을 때만 표시 */}
          {project.mandateId && (
            <DetailBox icon="ti-shield-check" label="연결된 Mandate">
              <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{linkedMandate?.name || project.mandateId}</div>
            </DetailBox>
          )}
          {project.agentId && (
            <DetailBox icon="ti-robot" label="연결된 Agent">
              <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{linkedAgent?.name || project.agentId}</div>
            </DetailBox>
          )}
        </div>
      </div>
    </div>
  );
}

// 정렬용 타임스탬프 추출 — mock은 "2026-06-18 14:32" 형태(Date로 바로 파싱 가능),
// 실 데이터는 한글 포맷(deployedAt)이라 Date로 못 읽어서 별도 저장해둔 _deployedAtRaw(ISO)를 우선 사용.
// 날짜 정보가 아예 없는 항목(배포 중/실패 등)은 정렬 방향과 무관하게 항상 맨 아래로.
function getSortTime(p) {
  if (p._deployedAtRaw) {
    const d = new Date(p._deployedAtRaw);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  if (p.deployedAt) {
    const d = new Date(p.deployedAt);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  return null;
}

export default function MyProjectPage({ projects, agents = [], mandates = [], devMode = false }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDir, setSortDir] = useState("desc"); // desc = 최신순, asc = 오래된순
  const [selectedId, setSelectedId] = useState(null);
  const [hiddenIds, setHiddenIds] = useState(loadHiddenProjectIds);

  const toggleHidden = (id) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveHiddenProjectIds(next);
      return next;
    });
  };

  const visibleProjects = devMode ? projects : projects.filter((p) => !hiddenIds.has(p.id));

  const filtered = visibleProjects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const withDate = [];
  const withoutDate = [];
  filtered.forEach((p) => {
    const t = getSortTime(p);
    if (t === null) withoutDate.push(p);
    else withDate.push({ p, t });
  });
  withDate.sort((a, b) => (sortDir === "desc" ? b.t - a.t : a.t - b.t));
  const sorted = [...withDate.map((x) => x.p), ...withoutDate];

  const selected = projects.find((p) => p.id === selectedId);

  if (selected) {
    return (
      <div style={{ padding: "36px 48px", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
        <ProjectDetail project={selected} agents={agents} mandates={mandates} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 48px", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      <div style={{ marginBottom: 20, paddingRight: 50 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.5px", marginBottom: 4 }}>내 프로젝트</div>
        <div style={{ fontSize: 13, color: "#bbb" }}>클라우드에 배포한 API/AI를 한눈에 관리하고 확인하세요.</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#111", display: "flex", alignItems: "center", gap: 8 }}>
          배포한 서비스
          <span style={{ background: "#EEF4FF", color: "#3182F6", fontSize: 11, fontWeight: 800, borderRadius: 99, padding: "2px 9px" }}>{visibleProjects.length}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, border: "1.5px solid #F0F0F0", fontSize: 12.5, fontWeight: 700, background: "#fff", color: "#555", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            <i className="ti ti-arrows-sort" style={{ fontSize: 13 }} />
            {sortDir === "desc" ? "최신순" : "오래된순"}
          </button>
          <div style={{ position: "relative" }}>
            <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#bbb" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="서비스 검색"
              style={{ padding: "8px 12px 8px 32px", borderRadius: 10, border: "1.5px solid #F0F0F0", fontSize: 12.5, background: "#fff", color: "#111", width: 160 }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #F0F0F0", fontSize: 12.5, background: "#fff", color: "#555" }}
          >
            {STATUS_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 18, padding: "48px 20px", textAlign: "center", color: "#bbb" }}>
          <i className="ti ti-server-2" style={{ fontSize: 28, color: "#ddd" }} />
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10, color: "#888" }}>
            {visibleProjects.length === 0 ? "아직 배포된 서비스가 없습니다." : "조건에 맞는 서비스가 없습니다."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sorted.map((p) => (
            <ServiceRow
              key={p.id}
              project={p}
              onOpen={() => setSelectedId(p.id)}
              devMode={devMode}
              hidden={hiddenIds.has(p.id)}
              onToggleHidden={toggleHidden}
            />
          ))}
        </div>
      )}
    </div>
  );
}
