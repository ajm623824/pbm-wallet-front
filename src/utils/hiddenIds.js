// 개발자 모드에서 눈 아이콘으로 숨긴 항목의 ID를 localStorage에 저장/조회하는 공용 유틸.
// TxLogPage/MyProjectPage(숨기기 토글)뿐 아니라 WalletPage/DashboardPage(읽기 전용 반영)에서도
// 같은 키를 참조해서, 한 곳에서 숨기면 다른 화면에서도 일관되게 안 보이게 만든다.

const LOG_KEY = "pbm_wallet_hidden_logs";
const PROJECT_KEY = "pbm_wallet_hidden_projects";

function loadIds(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); }
  catch { return new Set(); }
}
function saveIds(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* 저장 실패는 무시 */ }
}

export const loadHiddenLogIds = () => loadIds(LOG_KEY);
export const saveHiddenLogIds = (set) => saveIds(LOG_KEY, set);
export const loadHiddenProjectIds = () => loadIds(PROJECT_KEY);
export const saveHiddenProjectIds = (set) => saveIds(PROJECT_KEY, set);
