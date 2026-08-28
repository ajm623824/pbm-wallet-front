import { useEffect, useRef, useState } from "react";

// 페이지 제목 옆에 붙는 새로고침 위젯.
// - ↻ 버튼 클릭 → 즉시 갱신, 아이콘 돌면서 "업데이트 중..." → 끝나면 "방금 업데이트됨" 1.5초 표시
// - intervalMs마다 자동으로도 조용히 갱신 (화면 스피너 없이, 완료 시각만 갱신)
// - Agent가 계속 결제/배포 상태를 바꾸는 서비스라, 수동 F5 대신 이 조합으로 최신 상태를 보여준다.
function timeAgoLabel(date) {
  if (!date) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return "방금 업데이트됨";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}분 전 업데이트됨`;
  const hr = Math.floor(min / 60);
  return `${hr}시간 전 업데이트됨`;
}

export default function RefreshStatus({ title, onRefresh, intervalMs = 45000 }) {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const [, forceTick] = useState(0);
  const doneTimer = useRef(null);

  const runRefresh = async (manual) => {
    if (manual) setStatus("loading");
    try {
      await onRefresh?.();
    } finally {
      setLastUpdated(new Date());
      if (manual) {
        setStatus("done");
        clearTimeout(doneTimer.current);
        doneTimer.current = setTimeout(() => setStatus("idle"), 1500);
      }
    }
  };

  // 자동 갱신 — intervalMs마다 조용히 다시 조회 (버튼 애니메이션 없이 완료 시각만 갱신)
  useEffect(() => {
    const timer = setInterval(() => runRefresh(false), intervalMs);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  // "N분 전" 라벨이 시간이 지나면서 저절로 갱신되도록 1분마다 강제 리렌더
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => clearTimeout(doneTimer.current), []);

  const label = status === "loading" ? "업데이트 중..." : status === "done" ? "방금 업데이트됨" : timeAgoLabel(lastUpdated);
  const iconName = status === "done" ? "ti-check" : "ti-refresh";
  const iconColor = status === "done" ? "#00A064" : "#999";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.5px" }}>{title}</div>
      <button
        onClick={() => runRefresh(true)}
        disabled={status === "loading"}
        title="새로고침"
        style={{
          width: 26, height: 26, borderRadius: "50%", border: "none", background: "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: status === "loading" ? "default" : "pointer", flexShrink: 0,
        }}
      >
        <i
          className={`ti ${iconName}`}
          style={{
            fontSize: 15, color: iconColor,
            animation: status === "loading" ? "refresh-spin 0.8s linear infinite" : "none",
          }}
        />
      </button>
      <span style={{ fontSize: 11.5, color: "#bbb" }}>{label}</span>
      <style>{"@keyframes refresh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
