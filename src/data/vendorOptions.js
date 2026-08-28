// 클라우드 벤더 옵션 정의 — MandateForm(정책 설정)과 PolicyListPage(승인 목록)에서 공통으로 사용
// PBM(정부) 화이트리스트는 data/mockData.js의 mockPBM.allowedVendors 참고.
// Mandate(유저 위임)는 이 화이트리스트의 "부분집합"만 선택할 수 있다.
export const VENDOR_OPTIONS = [
  { key: "cloudflare", label: "Cloudflare", subtitle: "저렴하고 빠른 배포에 적합해요", icon: "ti-cloud", bg: "#F6821F", color: "#fff" },
  { key: "kt_cloud", label: "KT Cloud", subtitle: "대용량 서버 운영에 적합해요", icon: "K", bg: "#E4032E", color: "#fff" },
  { key: "ncp", label: "Naver Cloud", subtitle: "데이터 저장·백업에 적합해요", icon: "N", bg: "#03C75A", color: "#fff" },
  { key: "aws", label: "AWS", subtitle: "EC2 · Lambda · S3", icon: "ti-brand-aws", bg: "#232F3E", color: "#FF9900" },
  { key: "azure", label: "Azure", subtitle: "VM · Functions · Blob", icon: "ti-brand-windows", bg: "#fff", color: "#0078D4", border: "1.5px solid #ECECEC" },
];

export function getVendor(key) {
  return VENDOR_OPTIONS.find((v) => v.key === normalizeVendorKey(key));
}

// 백엔드 응답(GET /api/pbm)의 allowedVendors가 "kt"처럼 프론트 내부 키("kt_cloud")와
// 다른 축약형으로 올 수 있어서 화면 표시 직전에 맞춰준다.
const VENDOR_KEY_ALIASES = {
  kt: "kt_cloud",
  naver: "ncp",
  naver_cloud: "ncp",
};

export function normalizeVendorKey(key) {
  return VENDOR_KEY_ALIASES[key] || key;
}
