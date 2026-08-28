/**
 * PBM Agent 백엔드 연동 타입 정의 (JSDoc 주석용)
 * 실제 타입은 백엔드 API 응답으로 결정됩니다.
 */

/**
 * @typedef {Object} SignatureDict
 * @property {"eip-191"} signature_type
 * @property {string} wallet_address
 * @property {string} signed_by
 * @property {string} payload_hash
 * @property {string} signature_value
 */

/**
 * @typedef {Object} MandateBody
 * 실제 App.jsx의 handleSaveMandate()에서 서명·전송하는 필드와 동일하게 맞춤.
 * ⚠ 이 스펙은 프론트 임시 정의이며 백엔드 담당자와 최종 확정 전까지는 변경될 수 있음.
 * @property {string} mandate_id
 * @property {string} payer_wallet
 * @property {string|null} agent_address       - Agent 등록 전에는 null, 등록 후 채워짐
 * @property {string[]} selected_vendors       - PBM 화이트리스트의 부분집합
 * @property {number} total_budget             - 총 위임 예산(원)
 * @property {number} max_per_tx               - 1회 결제 최대 금액(원)
 * @property {number} daily_limit              - 일일 지출 한도(원)
 * @property {number} delegation_value         - 위임 기간 수치 (delegation_unit과 함께 사용)
 * @property {"day"|"hour"} delegation_unit    - 위임 기간 단위
 */

/**
 * @typedef {Object} AgentExecuteResponse
 * @property {"signing"|"broadcasting"|"confirming"|"confirmed"|"deploying"|"activated"
 *   |"rejected_pbm"|"rejected_mandate"|"pending_approval"|"failed_deploy"} status
 * @property {string} [txHash]
 * @property {string} [url]
 * @property {string} [failureReasonCode]
 */

export {};
