/**
 * MetaMask 서명 모듈
 *
 * 메커니즘:
 *   1. Mandate 폼(정책 설정 화면)에서 위임 조건(JSON)을 구성한다.
 *   2. hashMandatePayload()로 payload_hash를 만든다.
 *   3. MetaMask가 EIP-191 방식으로 signable_payload에 서명 → signature_value(0x...) 반환.
 *   4. SignatureDict 형태로 조립해 백엔드(POST /api/mandate/submit 등)로 전달한다.
 *
 * 실제 온체인 PBM 컨트랙트 실행/Cloudflare 결제는 백엔드 + 스마트컨트랙트 영역이라
 * 프론트만으로는 재현할 수 없다. 여기서는 "지갑 서명"까지만 실제로 동작한다.
 */

import { BrowserProvider, keccak256, toUtf8Bytes } from "ethers";

/**
 * 서명 대상 payload(JSON 문자열)의 해시를 만든다.
 * @param {string} signablePayload
 * @returns {string} 0x로 시작하는 keccak256 해시
 */
export function hashMandatePayload(signablePayload) {
  return keccak256(toUtf8Bytes(signablePayload));
}

/**
 * Mandate 서명
 *
 * @param {string} signablePayload - 서명 대상 JSON 문자열 (재가공 금지)
 * @param {string} payloadHash     - hashMandatePayload()로 만든 해시
 * @param {string} [preferredAddress] - 서명할 지갑 주소
 * @returns {Promise<{signatureType: "eip-191", walletAddress: string, signedBy: string, payloadHash: string, signatureValue: string}>}
 */
export async function signMandate(signablePayload, payloadHash, preferredAddress) {
  if (!window.ethereum) {
    throw new Error("MetaMask가 설치되어 있지 않습니다.");
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner(preferredAddress);
  const address = await signer.getAddress();

  // signable_payload를 그대로 signMessage에 전달 (재가공 금지)
  const signatureHex = await signer.signMessage(signablePayload);

  // 백엔드 스펙(POST /api/mandates)이 camelCase라 필드명을 맞춘다.
  return {
    signatureType: "eip-191",
    walletAddress: address,
    signedBy: address,
    payloadHash: payloadHash,
    signatureValue: signatureHex,
  };
}
