import MandateForm from "../components/MandateForm";
import { getVendor } from "../data/vendorOptions";

function formatExpiryDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function daysUntil(isoString) {
  const target = new Date(isoString);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function GovScopePanel({ pbm }) {
  return (
    <div style={{ width: 280, flexShrink: 0 }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: "20px 20px", position: "sticky", top: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <img
            src="/ICT.png"
            alt="정부 AI·클라우드 지원금"
            style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 2 }}>정부 AI·클라우드 지원금</div>
        </div>
        <div style={{ fontSize: 11.5, color: "#bbb", marginBottom: 16 }}>AI·클라우드 지원금 현황</div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F8F9FA", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "#EEF4FF", color: "#3182F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
            <i className="ti ti-wallet" />
          </span>
          <div>
            <div style={{ fontSize: 11, color: "#999" }}>정부 클라우드 지원금</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{Number(pbm.totalBudget).toLocaleString("ko-KR")} KRWC</div>
            {pbm.usedBudget != null && (
              <div style={{ fontSize: 11, color: "#3182F6", marginTop: 2, fontWeight: 700 }}>
                사용 가능: {Number(pbm.totalBudget - pbm.usedBudget).toLocaleString("ko-KR")} KRWC
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F8F9FA", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "#EEF4FF", color: "#3182F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
            <i className="ti ti-calendar" />
          </span>
          <div>
            <div style={{ fontSize: 11, color: "#999" }}>만료일</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{formatExpiryDate(pbm.expiresAt)}</div>
            {(() => {
              const d = daysUntil(pbm.expiresAt);
              return d != null ? (
                <div style={{ fontSize: 11, color: d < 30 ? "#E02020" : "#999", marginTop: 2, fontWeight: 700 }}>
                  D-{d}
                </div>
              ) : null;
            })()}
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginBottom: 10 }}>정부가 허용한 클라우드 업체</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {pbm.allowedVendors.map((key) => {
            const v = getVendor(key);
            const isGlyph = typeof v?.icon === "string" && v.icon.startsWith("ti-");
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: v?.bg, color: v?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                  {isGlyph ? <i className={`ti ${v.icon}`} /> : v?.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{v?.label || key}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, background: "#FFF8EC", borderRadius: 12, padding: "12px 14px" }}>
          <i className="ti ti-lock" style={{ fontSize: 14, color: "#C87800", flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 11.5, color: "#9A6200", lineHeight: 1.5 }}>
            AI Agent는 정부가 허용한 서비스<br></br> 내에서만 결제할 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PolicySettingsPage({ pbm, onSave, onCancel, saving }) {
  return (
    <div style={{ padding: "26px 48px 36px", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#111", letterSpacing: "-0.5px", marginBottom: 4 }}>AI 자금 사용 권한 설정</div>
        <div style={{ fontSize: 13.5, color: "#999", marginBottom: 18 }}><strong>AI에게 내 지원금 사용 권한을 위임합니다. </strong>위임 범위와 조건을 직접 설정할 수 있습니다.</div>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <MandateForm govWhitelist={pbm.allowedVendors} onCancel={onCancel} onSave={onSave} saving={saving} />
          </div>
          <GovScopePanel pbm={pbm} />
        </div>
      </div>
    </div>
  );
}
