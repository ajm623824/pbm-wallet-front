import { mockNotifications } from "../data/mockData";

const ICON = {
  done: { bg: "#E8FAF3", color: "#00A064", i: "ti-check" },
  fail: { bg: "#FFF0F0", color: "#E02020", i: "ti-ban" },
  info: { bg: "#EEF4FF", color: "#3182F6", i: "ti-info-circle" },
};

export default function NotificationPanel({ open, onClose, notifications = mockNotifications, unreadCount = 0 }) {
  return (
    <>
      {/* 벨 버튼 — 콘텐츠와 같은 스크롤 컨테이너 안에 두어, 스크롤하면 같이 움직여
         화면 밖으로 사라지게 함(고정 노출 아님). */}
      <div onClick={() => onClose(!open)} style={{
        position: "absolute", top: 28, right: 28,
        width: 34, height: 34, borderRadius: "50%",
        background: "#fff", border: "1px solid #F0F0F0",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", zIndex: 20,
      }}>
        <i className="ti ti-bell" style={{ fontSize: 17, color: "#888" }} />
        {unreadCount > 0 && (
          <div style={{
            position: "absolute", top: 6, right: 6, width: 8, height: 8,
            borderRadius: "50%", background: "#E02020", border: "2px solid #fff",
          }} />
        )}
      </div>
      {/* 패널 */}
      {open && (
        <div style={{
          position: "absolute", top: 68, right: 28, width: 260,
          background: "#fff", borderRadius: 16, border: "1px solid #F0F0F0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 30,
        }}>
          <div style={{ padding: "13px 18px 10px", fontSize: 13, fontWeight: 800, color: "#111", borderBottom: "1px solid #F5F5F5" }}>알림</div>
          {notifications.length === 0 && (
            <div style={{ padding: "20px 18px", fontSize: 12, color: "#bbb", textAlign: "center" }}>알림이 없습니다.</div>
          )}
          {notifications.map(n => {
            const ic = ICON[n.type] || ICON.done;
            return (
              <div key={n.id} style={{ display: "flex", gap: 10, padding: "11px 18px", borderBottom: "1px solid #F5F5F5", alignItems: "flex-start" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: ic.bg, color: ic.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginTop: 1 }}>
                  <i className={`ti ${ic.i}`} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#bbb", marginBottom: 2 }}>{n.time}</div>
                  <div style={{ fontSize: 12, color: "#111", fontWeight: 600, lineHeight: 1.4 }}>{n.msg}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
