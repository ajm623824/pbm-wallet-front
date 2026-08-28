import { useState } from "react";

// mock 고정 환율 — 실제 온체인 스왑은 아직 없어서 화면 시연용 고정값.
// 나중에 실 환율 API가 생기면 이 값만 API 응답으로 교체하면 됨.
const RATE_USDC_TO_KRWC = 1380; // 1 USDC = 1,380 KRWC
const FEE_USDC = 0.1; // 고정 수수료(USDC 기준)

const ASSET_META = {
  KRWC: { symbol: "KRWC", icon: "₩", color: "#3182F6" },
  USDC: { symbol: "USDC", icon: "$", color: "#2775CA" },
};

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
};
const cardStyle = {
  background: "#fff", borderRadius: 20, padding: 28, width: 340,
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
};
const boxStyle = {
  border: "1.5px solid #F0F0F0", borderRadius: 14, padding: "14px 16px", background: "#FAFAFA",
};
const badgeStyle = () => ({
  display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 99,
  background: "#fff", border: "1.5px solid #F0F0F0", fontSize: 13, fontWeight: 700, color: "#111", flexShrink: 0,
});

function toKrwc(usdc) { return usdc * RATE_USDC_TO_KRWC; }
function toUsdc(krwc) { return krwc / RATE_USDC_TO_KRWC; }

export default function ExchangeModal({ tokenBalance, onClose }) {
  const [fromAsset, setFromAsset] = useState("KRWC");
  const [fromAmount, setFromAmount] = useState("");
  const [done, setDone] = useState(false);

  const toAsset = fromAsset === "KRWC" ? "USDC" : "KRWC";
  const numericAmount = Number(fromAmount) || 0;

  // 입력 자산 → USDC 환산 → 수수료(0.1 USDC 고정) 차감 → 받는 자산으로 환산
  const usdcEquivalent = fromAsset === "KRWC" ? toUsdc(numericAmount) : numericAmount;
  const usdcAfterFee = Math.max(usdcEquivalent - FEE_USDC, 0);
  const toAmount = toAsset === "KRWC" ? toKrwc(usdcAfterFee) : usdcAfterFee;

  const canSubmit = numericAmount > 0;

  const handleSwapDirection = () => {
    setFromAsset(toAsset);
    setFromAmount(toAmount > 0 ? String(Number(toAmount.toFixed(4))) : "");
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    setDone(true);
  };

  const fmt = (n, asset) => asset === "KRWC" ? Math.round(n).toLocaleString() : n.toFixed(4);

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#111", letterSpacing: "-0.3px" }}>환전</div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 18, color: "#bbb", cursor: "pointer" }}>×</button>
        </div>

        {done ? (
          <>
            <div style={{ fontSize: 13, color: "#00A064", fontWeight: 700, marginBottom: 8 }}>전환 완료 (mock)</div>
            <div style={{ fontSize: 12, color: "#bbb", marginBottom: 18 }}>
              {fmt(numericAmount, fromAsset)} {fromAsset} → {fmt(toAmount, toAsset)} {toAsset}
            </div>
            <button onClick={onClose} style={{ width: "100%", padding: 12, border: "none", borderRadius: 12, background: "#3182F6", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>확인</button>
          </>
        ) : (
          <>
            {/* 보내는 자산 */}
            <div style={{ fontSize: 12, color: "#999", marginBottom: 6, fontWeight: 600 }}>보내는 자산</div>
            <div style={{ ...boxStyle, marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <input
                  type="number" placeholder="0" value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  style={{ border: "none", background: "transparent", fontSize: 24, fontWeight: 800, color: "#111", width: "100%", outline: "none" }}
                />
                <span style={badgeStyle(ASSET_META[fromAsset].color)}>
                  <span style={{ color: ASSET_META[fromAsset].color }}>{ASSET_META[fromAsset].icon}</span>
                  {ASSET_META[fromAsset].symbol}
                </span>
              </div>
              {fromAsset === "KRWC" && (
                <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>보유 {tokenBalance ?? "-"} KRWC</div>
              )}
            </div>

            {/* 스왑 버튼 */}
            <div style={{ display: "flex", justifyContent: "center", margin: "2px 0" }}>
              <button
                onClick={handleSwapDirection}
                style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid #F0F0F0", background: "#fff", color: "#3182F6", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="방향 전환"
              >
                <i className="ti ti-arrows-up-down" />
              </button>
            </div>

            {/* 받는 자산 */}
            <div style={{ fontSize: 12, color: "#999", marginBottom: 6, fontWeight: 600 }}>받는 자산</div>
            <div style={{ ...boxStyle, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#111" }}>{fmt(toAmount, toAsset)}</div>
                <span style={badgeStyle(ASSET_META[toAsset].color)}>
                  <span style={{ color: ASSET_META[toAsset].color }}>{ASSET_META[toAsset].icon}</span>
                  {ASSET_META[toAsset].symbol}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
                예상 수령 {fmt(toAmount, toAsset)} {toAsset}
              </div>
            </div>

            {/* 환율/수수료 */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#999", marginBottom: 12, padding: "0 2px" }}>
              <span>환율&nbsp; 1 USDC = {RATE_USDC_TO_KRWC.toLocaleString()} KRWC</span>
              <span>수수료&nbsp; {FEE_USDC} USDC</span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: 12, border: "none", borderRadius: 12, background: "#F4F4F4", fontSize: 14, fontWeight: 700, color: "#888", cursor: "pointer" }}>취소</button>
              <button
                onClick={handleConfirm} disabled={!canSubmit}
                style={{ flex: 1, padding: 12, border: "none", borderRadius: 12, background: canSubmit ? "#3182F6" : "#BFD9FE", fontSize: 14, fontWeight: 700, color: "#fff", cursor: canSubmit ? "pointer" : "not-allowed" }}
              >
                전환하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
