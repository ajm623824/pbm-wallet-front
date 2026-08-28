import { getVendor } from "../data/vendorOptions";

function fmt(n) {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString("ko-KR") : n || "-";
}

const STATUS_STYLE = {
  active: { bg: "#E8FAF3", color: "#00A064", label: "활성화됨" },
  pending_signature: { bg: "#FFF5E0", color: "#C87800", label: "서명 대기" },
  expired: { bg: "#F4F4F4", color: "#999", label: "만료됨" },
  revoked: { bg: "#FFF0F0", color: "#E02020", label: "철회됨" },
};

function VendorChip({ vendorKey }) {
  const v = getVendor(vendorKey);
  if (!v) return null;
  const isGlyph = typeof v.icon === "string" && v.icon.startsWith("ti-");
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EEF4FF", color: "#3182F6", borderRadius: 8, fontSize: 11.5, fontWeight: 700, padding: "5px 10px 5px 6px" }}>
      <span style={{ width: 16, height: 16, borderRadius: 5, background: v.bg, color: v.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
        {isGlyph ? <i className={`ti ${v.icon}`} /> : v.icon}
      </span>
      {v.label}
    </span>
  );
}

export function MandateCard({ mandate, onDelete, compact = false }) {
  const s = STATUS_STYLE[mandate.status] || STATUS_STYLE.active;
  const unitLabel = mandate.delegationUnit === "day" ? "일" : "시간";
  return (
    <div className="mandate-card" style={{ background: "#fff", borderRadius: 18, padding: "22px 24px", marginBottom: compact ? 0 : 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 4 }}>{mandate.name || "이름 없는 위임"}</div>
          <div style={{ fontSize: 11, color: "#bbb" }}>{mandate.createdAt} 생성 · Agent {mandate.agentAddress || "미등록"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "4px 12px" }}>
            <i className="ti ti-point-filled" style={{ fontSize: 8 }} />
            {s.label}
          </span>
          {mandate.syncError && (
            <span
              title={`서버 저장 실패: ${mandate.syncError}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FFF0F0", color: "#E02020", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "4px 10px" }}
            >
              <i className="ti ti-cloud-off" style={{ fontSize: 11 }} />
              서버 미저장
            </span>
          )}
          {mandate.chainError && (
            <span
              title={`온체인 등록 실패: ${mandate.chainError}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FFF0F0", color: "#E02020", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "4px 10px" }}
            >
              <i className="ti ti-link-off" style={{ fontSize: 11 }} />
              온체인 미등록
            </span>
          )}
          {mandate.chainTxHash && (
            <span
              title={`setMandateCondition tx: ${mandate.chainTxHash}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#E8FAF3", color: "#00A064", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "4px 10px" }}
            >
              <i className="ti ti-link" style={{ fontSize: 11 }} />
              온체인 등록됨
            </span>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(mandate.id)}
              title="철회"
              style={{ width: 30, height: 30, border: "1.5px solid #F0F0F0", borderRadius: 9, background: "#fff", color: "#bbb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <i className="ti ti-trash" style={{ fontSize: 14 }} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "#F8F9FA", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginBottom: 4 }}>최대 얼마까지?</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{fmt(mandate.totalBudget)} KRWC</div>
        </div>
        <div style={{ background: "#F8F9FA", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginBottom: 4 }}>1회 최대 결제</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{fmt(mandate.maxPerTx)} KRWC</div>
        </div>
        <div style={{ background: "#F8F9FA", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginBottom: 4 }}>일일 지출 한도</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{fmt(mandate.dailyLimit)} KRWC</div>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", letterSpacing: "0.3px", marginBottom: 8 }}>선택한 클라우드 벤더</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {mandate.selectedVendors?.length ? (
          mandate.selectedVendors.map((key) => <VendorChip key={key} vendorKey={key} />)
        ) : (
          <span style={{ fontSize: 12, color: "#ccc" }}>선택된 벤더가 없습니다.</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginBottom: 4 }}>실행 기간</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{mandate.delegationValue}{unitLabel}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginBottom: 4 }}>위임 만료일</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{mandate.delegationExpiresAt || "-"}</div>
        </div>
      </div>
    </div>
  );
}

export default function PolicyListPage({ mandates, onCreate, onDelete }) {
  return (
    <div style={{ padding: "36px 48px", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingRight: 50 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.5px", marginBottom: 4 }}>AI 권한 관리</div>
          <div style={{ fontSize: 13, color: "#bbb" }}>AI에게 위임한 결제 조건을 확인하고 관리하세요.</div>
        </div>
        <button
          onClick={onCreate}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", border: "none", borderRadius: 10, background: "#3182F6", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          새 위임 만들기
        </button>
      </div>

      {mandates.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 18, padding: "60px 20px", textAlign: "center", color: "#bbb" }}>
          <i className="ti ti-file-off" style={{ fontSize: 32, color: "#ddd" }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12, color: "#888" }}>위임된 정책이 없습니다.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Mandate &gt; Mandate 생성에서 새 위임을 만들어보세요.</div>
        </div>
      ) : (
        mandates.map((mandate) => <MandateCard key={mandate.id} mandate={mandate} onDelete={onDelete} />)
      )}
    </div>
  );
}
