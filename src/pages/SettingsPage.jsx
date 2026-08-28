import { API_BASE_URL } from "../api/httpClient";

function Row({ label, value, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #F5F5F5" }}>
      <span style={{ fontSize: 13, color: "#999" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#111", fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
    </div>
  );
}

export default function SettingsPage({ address, chainId, session, authAction, authError, onRegisterPasskey, onStepUp, onDisconnect }) {
  const stepUpComplete = Boolean(session?.stepUpComplete || session?.stepUpRequired === false);
  return (
    <div style={{ padding: "36px 48px", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.5px", marginBottom: 20, paddingRight: 50 }}>설정</div>

      <div style={{ fontSize: 13, fontWeight: 800, color: "#111", marginBottom: 10 }}>계정</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "6px 20px", marginBottom: 22 }}>
        <Row label="지갑 주소" value={address || "—"} mono />
        <Row label="네트워크" value={chainId ? `Chain #${chainId}` : "—"} />
        <Row label="로그인 방식" value="SIWE (MetaMask 서명)" />
        <Row label="서버 세션" value={session?.expiresAt ? `만료 ${new Date(session.expiresAt).toLocaleTimeString()}` : "인증됨"} />
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: "#111", marginBottom: 10 }}>연동</div>
      <div style={{ background: "#fff", borderRadius: 16, padding: "6px 20px", marginBottom: 22 }}>
        <Row label="PBM 백엔드" value={API_BASE_URL} mono />
        <Row label="Passkey 추가 인증" value={stepUpComplete ? "완료" : "필요"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <button
          onClick={onRegisterPasskey}
          disabled={Boolean(authAction)}
          style={{ padding: "13px 0", borderRadius: 14, border: "1.5px solid #D7E5FF", background: "#F5F8FF", color: "#246FD6", fontSize: 14, fontWeight: 700 }}
        >
          {authAction === "register" ? "등록 중…" : "Passkey 등록"}
        </button>
        <button
          onClick={onStepUp}
          disabled={Boolean(authAction) || stepUpComplete}
          style={{ padding: "13px 0", borderRadius: 14, border: 0, background: stepUpComplete ? "#D7E5DD" : "#3182F6", color: "#fff", fontSize: 14, fontWeight: 700 }}
        >
          {authAction === "step-up" ? "인증 중…" : stepUpComplete ? "추가 인증 완료" : "Passkey로 추가 인증"}
        </button>
      </div>

      {authError && (
        <div style={{ background: "#FFF5F5", border: "1px solid #F7C1C1", borderRadius: 12, padding: "11px 14px", marginBottom: 14, fontSize: 13, color: "#C0392B" }}>
          {authError}
        </div>
      )}

      <div style={{ color: "#7B8794", fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>
        Passkey는 서버가 발급한 WebAuthn challenge로만 진행됩니다. 서버 검증이 구성되지 않은 환경에서는 완료 상태로 처리하지 않습니다.
      </div>

      <button
        onClick={onDisconnect}
        style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "1.5px solid #F7C1C1", background: "#FFF5F5", color: "#E02020", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <i className="ti ti-plug-x" style={{ fontSize: 16 }} />
        로그아웃
      </button>
    </div>
  );
}
