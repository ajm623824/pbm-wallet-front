import { useRef, useState } from "react";

const NAV = [
  { key: "wallet", icon: "ti-wallet", label: "지원금 지갑",
    children: [
      { key: "wallet", label: "정부 AI·클라우드 지원금" },
      { key: "krwc_wallet_mock", label: "KRWC 지갑" },
    ], },
  {
    key: "pbm",
    icon: "ti-shield-check",
    label: "지원금 권한 설정",
    children: [
      { key: "policy_settings", label: "AI 자금 사용 권한 설정" },
      { key: "policy_list", label: "AI 권한 관리" },
    ],
  },
  { key: "agent", icon: "ti-robot", label: "스마트 AI 비서" },
  { key: "txlog", icon: "ti-list-details", label: "지원금 사용 내역" },
  { key: "dashboard", icon: "ti-layout-dashboard", label: "지원금 현황" },
  { key: "my_project", icon: "ti-server-2", label: "내 프로젝트" },
  { key: "settings", icon: "ti-settings", label: "설정" },
];

export default function Sidebar({ current, onChange, onDisconnect, pendingCount = 0, devMode = false, onToggleDevMode }) {
  const activeParent = NAV.find((n) => n.children?.some((c) => c.key === current));
  const [expandedKey, setExpandedKey] = useState(activeParent?.key || null);
  const settingsClicksRef = useRef([]);

  // "설정" 메뉴를 0.8초 안에 3번 연속 클릭하면 개발자 모드 토글 — 숨은 기능이라 UI에 안내는 없음.
  const handleSettingsClick = () => {
    // eslint-disable-next-line react-hooks/purity -- event handler only, not called during render
    const now = Date.now();
    const recent = [...settingsClicksRef.current.filter((t) => now - t < 800), now];
    settingsClicksRef.current = recent;
    if (recent.length >= 3) {
      settingsClicksRef.current = [];
      onToggleDevMode?.();
    }
  };

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#fff",
        borderRight: "1px solid #F0F0F0",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "24px 20px 16px" }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#111", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 6 }}>
          PBM<span style={{ color: "#3182F6" }}>.</span>Wallet
          {devMode && (
            <span style={{ fontSize: 9, fontWeight: 800, color: "#6B4EFF", background: "#F0F0FF", borderRadius: 6, padding: "2px 6px", letterSpacing: "0.3px" }}>DEV</span>
          )}
        </div>
      </div>

      <nav style={{ padding: "4px 10px", flex: 1 }}>
        {NAV.map((item) => {
          const hasChildren = !!item.children;
          const isParentActive = hasChildren ? item.children.some((c) => c.key === current) : current === item.key;
          const isOpen = hasChildren && (expandedKey === item.key || isParentActive);

          return (
            <div key={item.key}>
              <div
                onClick={() => {
                  if (hasChildren) {
                    setExpandedKey((prev) => (prev === item.key ? null : item.key));
                  } else {
                    onChange(item.key);
                    if (item.key === "settings") handleSettingsClick();
                  }
                }}
                onMouseEnter={(e) => { if (!isParentActive) e.currentTarget.style.background = "#F8F9FA"; }}
                onMouseLeave={(e) => { if (!isParentActive) e.currentTarget.style.background = "transparent"; }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "11px 12px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: 2,
                  color: isParentActive ? "#3182F6" : "#888",
                  background: isParentActive ? "#EEF4FF" : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 16, color: isParentActive ? "#3182F6" : "#ccc" }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.key === "agent" && pendingCount > 0 && (
                  <span style={{ background: "#E02020", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 99, padding: "1px 6px", marginRight: hasChildren ? 4 : 0 }}>
                    {pendingCount}
                  </span>
                )}
                {hasChildren && (
                  <i
                    className={`ti ${isOpen ? "ti-chevron-up" : "ti-chevron-down"}`}
                    style={{ fontSize: 13, color: "#ccc" }}
                  />
                )}
              </div>

              {hasChildren && isOpen && (
                <div style={{ marginBottom: 4 }}>
                  {item.children.map((c) => {
                    const on = current === c.key;
                    return (
                      <div
                        key={c.key}
                        onClick={() => onChange(c.key)}
                        onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "#F8F9FA"; }}
                        onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "9px 12px 9px 22px",
                          borderRadius: 10,
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          marginBottom: 1,
                          color: on ? "#3182F6" : "#999",
                          background: on ? "#EEF4FF" : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: on ? "#3182F6" : "#ddd",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ flex: 1 }}>{c.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: "12px 10px 16px" }}>
        <div
          onClick={onDisconnect}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "10px 12px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            color: "#bbb",
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FFF5F5";
            e.currentTarget.style.color = "#E02020";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#bbb";
          }}
        >
          <i className="ti ti-plug-x" style={{ fontSize: 16 }} />
          연결 해제
        </div>
      </div>
    </aside>
  );
}
