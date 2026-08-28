import { useState } from "react";
import { Contract, parseUnits, isAddress } from "ethers";
import { ERC20_ABI, TOKEN_CONTRACT_ADDRESS } from "../config/contract";

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
};
const cardStyle = {
  background: "#fff", borderRadius: 20, padding: 28, width: 320,
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
};
const inputStyle = {
  display: "block", width: "100%", padding: "12px 14px", marginBottom: 10,
  border: "1.5px solid #F0F0F0", borderRadius: 12, fontSize: 14,
  background: "#FAFAFA", color: "#111", boxSizing: "border-box",
};

export default function TransferModal({ signer, tokenSymbol = "KRWC", onClose, onSuccess }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const canSubmit = isAddress(recipient) && Number(amount) > 0 && status !== "sending";

  const handleSend = async () => {
    setError(null);
    if (!signer) { setError("지갑이 연결되어 있지 않습니다. MetaMask로 다시 로그인해주세요."); return; }
    if (!isAddress(recipient)) { setError("받는 주소 형식이 올바르지 않습니다."); return; }
    if (!(Number(amount) > 0)) { setError("금액을 입력해주세요."); return; }

    setStatus("sending");
    try {
      const contract = new Contract(TOKEN_CONTRACT_ADDRESS, ERC20_ABI, signer);
      let decimals = 6; // USDC 표준
      try { decimals = await contract.decimals(); } catch { /* 컨트랙트가 decimals()를 안 주면 기본 6 사용 */ }
      const parsedAmount = parseUnits(amount, decimals);
      const tx = await contract.transfer(recipient, parsedAmount);
      setTxHash(tx.hash);
      await tx.wait();
      setStatus("done");
      onSuccess?.();
    } catch (err) {
      setStatus("idle");
      if (err?.code === "ACTION_REJECTED" || err?.code === 4001) setError("서명을 취소했습니다.");
      else setError(err?.shortMessage || err?.message || "전송 중 오류가 발생했습니다.");
    }
  };

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={cardStyle}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#111", marginBottom: 18, letterSpacing: "-0.3px" }}>이체</div>

        {status === "done" ? (
          <>
            <div style={{ fontSize: 13, color: "#00A064", fontWeight: 700, marginBottom: 8 }}>전송 완료</div>
            <div style={{ fontSize: 11, color: "#bbb", wordBreak: "break-all", marginBottom: 18 }}>tx: {txHash}</div>
            <button onClick={onClose} style={{ width: "100%", padding: 12, border: "none", borderRadius: 12, background: "#3182F6", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>확인</button>
          </>
        ) : (
          <>
            <input
              type="text" placeholder="받는 주소 (0x...)" value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              disabled={status === "sending"} style={inputStyle}
            />
            <input
              type="number" placeholder={`금액 (${tokenSymbol})`} value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={status === "sending"} style={inputStyle}
            />
            <div style={{ fontSize: 12, color: "#bbb", marginBottom: 14 }}>
              {status === "sending" ? "MetaMask에서 서명을 확인해주세요..." : "MetaMask 서명이 필요합니다"}
            </div>
            {error && <div style={{ fontSize: 12, color: "#E02020", marginBottom: 10 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} disabled={status === "sending"} style={{ flex: 1, padding: 12, border: "none", borderRadius: 12, background: "#F4F4F4", fontSize: 14, fontWeight: 700, color: "#888", cursor: "pointer" }}>취소</button>
              <button
                onClick={handleSend} disabled={!canSubmit}
                style={{ flex: 1, padding: 12, border: "none", borderRadius: 12, background: canSubmit ? "#3182F6" : "#BFD9FE", fontSize: 14, fontWeight: 700, color: "#fff", cursor: canSubmit ? "pointer" : "not-allowed" }}
              >
                {status === "sending" ? "전송 중..." : "보내기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
