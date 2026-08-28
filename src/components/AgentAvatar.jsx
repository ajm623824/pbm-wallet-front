import { useMemo } from "react";
import { toSvg } from "jdenticon";

// 특정 Agent에는 identicon 대신 실제 이미지를 보여주기 위한 매핑.
// 여기 없는 agentId는 기존처럼 자동 생성 identicon을 그대로 사용한다.
const CUSTOM_AVATARS = {
  "cd3638e4-e4e3-4762-a1ec-cfffe3c430d6": "/ICT.png",
};

// Agent별로 고유한 identicon(jdenticon.com)을 만들어주는 아바타.
// seed(agent id/agentId 등)가 같으면 항상 같은 아이콘이 나오고, 다르면 다른 아이콘이 나옴
// — 진짜 랜덤이 아니라 "값 기반 고유 패턴"이라 새로고침해도 같은 Agent는 같은 아이콘을 유지함.
export default function AgentAvatar({ seed, size = 40, rounded = true }) {
  const customSrc = CUSTOM_AVATARS[String(seed)];

  const svg = useMemo(() => toSvg(String(seed || "agent"), size, { padding: 0.12 }), [seed, size]);

  if (customSrc) {
    return (
      <span
        style={{
          width: size, height: size, borderRadius: rounded ? "50%" : 10,
          overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#F4F4F4",
        }}
      >
        <img src={customSrc} alt="Agent" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </span>
    );
  }

  return (
    <span
      style={{
        width: size, height: size, borderRadius: rounded ? "50%" : 10,
        overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#F4F4F4",
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}