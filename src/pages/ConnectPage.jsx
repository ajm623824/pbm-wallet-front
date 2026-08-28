export default function ConnectPage({ onConnect, isLoading, error }) {
  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw",
      overflow: "hidden", /* 외부 스크롤 완전 차단 */
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* 왼쪽 패널 */}
      <div style={{
        flex: 1, background: "linear-gradient(145deg, #EEF4FF 0%, #D6E6FF 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "60px 48px", position: "relative",
        overflow: "hidden",
      }}>
        {/* 배경 장식 원 */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(49,130,246,0.08)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(49,130,246,0.06)" }} />

        {/* 일러스트 영역 */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 380 }}>
          {/* SVG 일러스트 */}
          <svg viewBox="0 0 360 280" width="100%" style={{ maxWidth: 360, marginBottom: 32 }}>
            {/* 배경 카드들 */}
            <rect x="40" y="120" width="200" height="120" rx="16" fill="#3182F6" opacity="0.15"/>
            <rect x="20" y="100" width="220" height="130" rx="16" fill="#3182F6" opacity="0.25"/>
            <rect x="10" y="85" width="230" height="140" rx="16" fill="#3182F6" opacity="0.9"/>
            {/* 카드 줄무늬 */}
            <rect x="10" y="115" width="230" height="28" fill="#2570e8"/>
            {/* 카드 칩 */}
            <rect x="30" y="148" width="36" height="28" rx="4" fill="#FFD700" opacity="0.9"/>
            <rect x="34" y="152" width="28" height="8" rx="2" fill="#FFA500" opacity="0.6"/>
            <rect x="34" y="163" width="28" height="8" rx="2" fill="#FFA500" opacity="0.6"/>
            {/* 카드 번호 점들 */}
            {[80,100,120,140].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy={158} r="3" fill="white" opacity="0.7"/>
                <circle cx={x+10} cy={158} r="3" fill="white" opacity="0.7"/>
                <circle cx={x+20} cy={158} r="3" fill="white" opacity="0.7"/>
              </g>
            ))}
            {/* 사람 */}
            <circle cx="220" cy="60" r="28" fill="#3182F6" opacity="0.2"/>
            <circle cx="220" cy="52" r="18" fill="#FFB347"/>
            <rect x="200" y="68" width="40" height="50" rx="8" fill="#3182F6"/>
            <rect x="190" y="72" width="16" height="36" rx="8" fill="#3182F6"/>
            <rect x="234" y="72" width="16" height="36" rx="8" fill="#3182F6"/>
            <rect x="205" y="116" width="14" height="40" rx="7" fill="#4A90D9"/>
            <rect x="221" y="116" width="14" height="40" rx="7" fill="#4A90D9"/>
            {/* 코인들 */}
            <circle cx="290" cy="90" r="30" fill="#3182F6" opacity="0.85"/>
            <circle cx="290" cy="90" r="22" fill="#2570e8"/>
            <text x="290" y="96" textAnchor="middle" fill="white" fontSize="16" fontWeight="800">₿</text>
            <circle cx="270" cy="55" r="20" fill="#5B9BD5" opacity="0.7"/>
            <circle cx="270" cy="55" r="14" fill="#4A8BC4"/>
            <text x="270" y="60" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">₩</text>
            {/* 시계 */}
            <circle cx="310" cy="50" r="24" fill="white" opacity="0.8"/>
            <circle cx="310" cy="50" r="18" fill="white"/>
            <circle cx="310" cy="50" r="2" fill="#3182F6"/>
            <line x1="310" y1="50" x2="310" y2="38" stroke="#3182F6" strokeWidth="2" strokeLinecap="round"/>
            <line x1="310" y1="50" x2="320" y2="50" stroke="#3182F6" strokeWidth="2" strokeLinecap="round"/>
          </svg>

          <div style={{ fontSize: 26, fontWeight: 800, color: "#1a1a2e", marginBottom: 12, letterSpacing: "-0.5px", lineHeight: 1.3 }}>
            AI Agent의 클라우드 배포를<br/>안전하게 위임하세요
          </div>
          <div style={{ fontSize: 15, color: "#6b7a99", lineHeight: 1.7 }}>
            PBM · Mandate 이중검증으로 AI Agent의 클라우드<br/>인프라 결제 권한을 설정하고 실시간으로 모니터링합니다.
          </div>

          {/* 점 인디케이터 - 1개 */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <div style={{ width: 24, height: 8, borderRadius: 4, background: "#3182F6" }} />
          </div>
        </div>
      </div>

      {/* 오른쪽 패널 */}
      <div style={{
        width: 480, background: "#fff",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "60px 56px",
      }}>
        <div style={{ width: "100%", maxWidth: 360 }}>

          {/* 로고 */}
          <div style={{ fontSize: 13, color: "#3182F6", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 24 }}>
            PBM · WALLET
          </div>

          {/* 인사 */}
          <div style={{ fontSize: 28, fontWeight: 800, color: "#111", marginBottom: 8, letterSpacing: "-0.5px" }}>
            👋 안녕하세요!
          </div>
                  <div style={{
                      fontSize: 15,
                      color: "#888",
                      marginBottom: 40,
                      lineHeight: 1.5,
                      whiteSpace: "nowrap",
                  }}>
                      지갑을 연결하고 SIWE 서명으로 로그인하세요.
                  </div>

          {/* MetaMask 연결 버튼 */}
          <button
            onClick={onConnect}
            disabled={isLoading}
            style={{
              width: "100%", padding: "16px 24px",
              border: "none", borderRadius: 14,
              fontSize: 16, fontWeight: 700,
              background: isLoading ? "#C8D8F8" : "#3182F6",
              color: "#fff", cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginBottom: 14,
            }}
          >
            {isLoading ? (
              <>
                <i className="ti ti-loader" style={{ fontSize: 20, animation: "spin 1s linear infinite" }} />
                SIWE 로그인 중...
              </>
            ) : (
              <>
                <i className="ti ti-wallet" style={{ fontSize: 20 }} />
                MetaMask로 로그인
              </>
            )}
          </button>

          {/* 에러 메시지 */}
          {error && (
            <div style={{
              background: "#FFF5F5", border: "1px solid #F7C1C1",
              borderRadius: 12, padding: "12px 16px", marginBottom: 14,
              display: "flex", gap: 8, alignItems: "flex-start",
              fontSize: 13, color: "#C0392B",
            }}>
              <i className="ti ti-alert-circle" style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {/* 구분선 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
            <span style={{ fontSize: 12, color: "#ccc", fontWeight: 600 }}>또는</span>
            <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
          </div>

          {/* MetaMask 설치 안내 */}
          <div style={{
            width: "100%", padding: "14px 20px",
            border: "1.5px solid #F0F0F0", borderRadius: 14,
            display: "flex", alignItems: "center", gap: 12,
            fontSize: 14, color: "#888", cursor: "pointer",
            textDecoration: "none",
          }}
            onClick={() => window.open("https://metamask.io/download/", "_blank")}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="ti ti-download" style={{ fontSize: 18, color: "#F5A623" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>MetaMask 설치하기</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>브라우저 확장 프로그램 설치</div>
            </div>
            <i className="ti ti-chevron-right" style={{ marginLeft: "auto", color: "#ccc" }} />
          </div>

          {/* 하단 안내 */}
          <div style={{ marginTop: 32, fontSize: 12, color: "#bbb", textAlign: "center", lineHeight: 1.7 }}>
            계정 연결 후 서버 nonce가 포함된 로그인 메시지에 서명합니다.<br/>
            지갑 주소만으로는 서비스 권한이 부여되지 않습니다.
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
