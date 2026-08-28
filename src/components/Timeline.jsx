const IC = {
  ok:       { bg: "#E8FAF3", color: "#00A064", icon: "ti-check" },
  fail:     { bg: "#FFF0F0", color: "#E02020", icon: "ti-x" },
  progress: { bg: "#FFF5E0", color: "#C87800", icon: "ti-loader" },
  wait:     { bg: "#F4F4F4", color: "#ccc",    icon: "ti-minus" },
};
const META_COLOR = { green: "#00A064", red: "#E02020", progress: "#C87800" };

export default function Timeline({ steps, compact = false }) {
  if (compact) {
    return (
      <div style={{ padding: "10px 0 10px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.filter(s => s.status !== "wait").map((step, i) => {
          const ic = IC[step.status];
          return (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: ic.bg, color: ic.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                <i className={`ti ${ic.icon}`} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: step.status === "fail" ? "#E02020" : step.status === "progress" ? "#C87800" : "#111" }}>{step.label}</div>
                {step.ts && <div style={{ fontSize: 11.5, color: "#bbb" }}>{step.desc ? `${step.desc} · ` : ""}{step.ts}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 18px" }}>
      {steps.map((step, i) => {
        const ic = IC[step.status];
        const isLast = i === steps.length - 1;
        return (
          <div key={i} style={{ display: "flex", gap: 0, marginBottom: isLast ? 0 : 12 }}>
            {/* 왼쪽: 아이콘 + 시간 + 연결선 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 60, flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: ic.bg, color: ic.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, position: "relative", zIndex: 1 }}>
                <i className={`ti ${ic.icon}`} />
              </div>
              {step.ts && (
                <div style={{ fontSize: 10.5, color: "#bbb", fontFamily: "monospace", marginTop: 3, textAlign: "center", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                  {step.ts}
                </div>
              )}
              {!isLast && (
                <div style={{ width: 1.5, background: "#EBEBEB", flex: 1, minHeight: 10, marginTop: 3 }} />
              )}
            </div>
            {/* 오른쪽: 내용 */}
            <div style={{ flex: 1, paddingTop: 2, paddingLeft: 10 }}>
              <div style={{
                fontSize: 14, fontWeight: 700, marginBottom: step.desc ? 4 : 0,
                color: step.status === "fail" ? "#E02020" : step.status === "progress" ? "#C87800" : step.status === "wait" ? "#ccc" : "#111",
              }}>{step.label}</div>
              {step.desc && <div style={{ fontSize: 12.5, color: "#888", marginBottom: 6, lineHeight: 1.5 }}>{step.desc}</div>}
              {step.meta && (
                <div style={{ background: "#F4F5F7", borderRadius: 8, padding: "9px 13px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {step.meta.map((m, j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, gap: 12 }}>
                      <span style={{ color: "#999", fontWeight: 600, flexShrink: 0 }}>{m.k}</span>
                      <span style={{
                        fontFamily: m.color ? "inherit" : "monospace",
                        fontSize: m.color ? 12.5 : 11.5,
                        fontWeight: m.mono ? 700 : (m.color ? 700 : 500),
                        color: m.color ? META_COLOR[m.color] : "#333",
                        wordBreak: "break-all",
                        textAlign: "right",
                      }}>{m.v}</span>
                    </div>
                  ))}
                </div>
              )}
              {step.reason && (
                <div style={{ marginTop: 8, background: "#FFF5F5", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 7, fontSize: 12.5, color: "#C0392B", lineHeight: 1.5 }}>
                  <i className="ti ti-alert-circle" style={{ flexShrink: 0, marginTop: 1, fontSize: 13 }} />
                  <span>차단 사유 — {step.reason}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}