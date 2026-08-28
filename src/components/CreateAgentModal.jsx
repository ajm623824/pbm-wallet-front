import { useState } from "react";

export default function CreateAgentModal({ onCancel, onCreate }) {
  const [name, setName] = useState("");
  const [clientInfo, setClientInfo] = useState("Web Client");

  const isValid = name.trim().length > 0;

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 4, letterSpacing: "-0.3px" }}>AI Agent 만들기</div>
        <div style={{ fontSize: 12.5, color: "#bbb", marginBottom: 22 }}>이 Agent가 내 지갑에 접근해 배포 결제를 실행할 수 있게 됩니다.</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111", marginBottom: 6 }}>Agent 이름 *</div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예) 클라우드 배포 에이전트"
            style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #F0F0F0", borderRadius: 12, fontSize: 14, background: "#FAFAFA", color: "#111" }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111", marginBottom: 6 }}>클라이언트 정보 *</div>
          <input
            value={clientInfo}
            onChange={(e) => setClientInfo(e.target.value)}
            placeholder="예) Web Client"
            style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #F0F0F0", borderRadius: 12, fontSize: 14, background: "#FAFAFA", color: "#111" }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 12, border: "1.5px solid #F0F0F0", borderRadius: 12, background: "#fff", fontSize: 14, fontWeight: 700, color: "#888", cursor: "pointer" }}>
            취소
          </button>
          <button
            onClick={() => isValid && onCreate({ name: name.trim(), clientInfo: clientInfo.trim() })}
            disabled={!isValid}
            style={{ flex: 1, padding: 12, border: "none", borderRadius: 12, background: isValid ? "#3182F6" : "#CBD8EE", fontSize: 14, fontWeight: 700, color: "#fff", cursor: isValid ? "pointer" : "not-allowed" }}
          >
            Agent 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
