import { useState } from "react";

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
};
const cardStyle = {
  background: "#fff", borderRadius: 20, padding: 28, width: 320,
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
};

export default function ChargeModal({ walletAddress, onClose }) {
  const [copied, setCopied] = useState(false);
  const qrSrc = walletAddress
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(walletAddress)}`
    : null;

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* 클립보드 권한 없으면 조용히 무시 */ }
  };

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={cardStyle}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#111", marginBottom: 6, letterSpacing: "-0.3px" }}>충전</div>
        <div style={{ fontSize: 12, color: "#999", marginBottom: 18, lineHeight: 1.5 }}>
          아래 주소로 다른 지갑에서 USDC(Base Sepolia)를 보내주세요. 입금이 확인되면 잔액에 자동 반영됩니다.
        </div>

        {qrSrc && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <img src={qrSrc} alt="지갑 주소 QR코드" width={160} height={160} style={{ borderRadius: 12, border: "1px solid #F0F0F0" }} />
          </div>
        )}

        <div style={{ background: "#FAFAFA", border: "1.5px solid #F0F0F0", borderRadius: 12, padding: "12px 14px", marginBottom: 10, fontFamily: "monospace", fontSize: 12.5, color: "#111", wordBreak: "break-all" }}>
          {walletAddress || "지갑이 연결되어 있지 않습니다"}
        </div>

        <div style={{ fontSize: 12, color: "#bbb", marginBottom: 14 }}>
          Base Sepolia 테스트넷 주소로만 전송해주세요. 다른 네트워크로 보내면 자금이 손실될 수 있습니다.
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, border: "none", borderRadius: 12, background: "#F4F4F4", fontSize: 14, fontWeight: 700, color: "#888", cursor: "pointer" }}>닫기</button>
          <button
            onClick={handleCopy} disabled={!walletAddress}
            style={{ flex: 1, padding: 12, border: "none", borderRadius: 12, background: "#3182F6", fontSize: 14, fontWeight: 700, color: "#fff", cursor: walletAddress ? "pointer" : "not-allowed" }}
          >
            {copied ? "복사됨!" : "주소 복사"}
          </button>
        </div>
      </div>
    </div>
  );
}
