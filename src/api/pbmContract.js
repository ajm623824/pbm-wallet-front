import { BrowserProvider, Contract, parseUnits } from "ethers";

/**
 * Mandate 저장 시 setMandateCondition()을 실제 온체인 트랜잭션으로 실행한다.
 * mandateSigner.js의 signMandate()(EIP-191 메시지 서명, 가스 없음)와는 다르게,
 * 이건 실제 컨트랙트 write라 MetaMask가 "서명"이 아니라 "트랜잭션 승인" 팝업을
 * 띄우고 가스가 든다. tokenId 소유자 지갑으로만 호출 가능하다(아니면 NotTokenOwner revert).
 *
 * 이번엔 시나리오 하나만 돌리는 데모라 Agent 지갑/컨트랙트 주소를 하드코딩한다.
 * Mandate를 여러 Agent 중 하나에 연결하는 UI가 생기면 이 부분을 교체해야 한다.
 */
export const PBM_WRAPPER_ADDRESS = "0x2B313076BB5E0CcA650E387442ac024b17d30927"; // Base Sepolia
const HARDCODED_AGENT_ADDRESS = "0xdFeaaC981817AF5F527728d2F66E55ba8bDc3708";

// deployMock.ts와 동일한 온체인 벤더 주소. AWS/Azure는 이 데모 컨트랙트에 대응하는
// 주소가 없어서, 매핑에 없으면 allowedVendors에서 조용히 빠진다.
const VENDOR_ONCHAIN_ADDRESS = {
  cloudflare: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  kt_cloud: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  ncp: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
};

// setMandateCondition()이 실제로 던질 수 있는 커스텀 에러 두 가지(PBMWrapper.sol)를
// 같이 선언해둬야 ethers가 revert 데이터를 "execution reverted (unknown custom error)"
// 대신 이름 있는 에러로 디코딩한다.
const SET_MANDATE_ABI = [
  "function setMandateCondition(uint256 tokenId, (address agentAddress, uint256 autoLimit, uint256 expiresAt, address[] allowedVendors) condition) external",
  "error NotTokenOwner(uint256 tokenId, address caller)",
  "error ZeroAddress()",
];

// 디코딩된 커스텀 에러 이름 -> 사용자에게 보여줄 한국어 메시지.
function friendlyRevertMessage(name, args, tokenId) {
  if (name === "NotTokenOwner") {
    return `이 지갑은 tokenId=${tokenId}의 소유자가 아닙니다. 소유자 지갑으로 연결한 뒤 다시 시도해주세요.`;
  }
  if (name === "ZeroAddress") {
    return "Agent 주소가 비어 있어 등록할 수 없습니다.";
  }
  return null;
}

function decodeSetMandateError(err, tokenId) {
  // ethers v6는 인터페이스가 에러를 알고 있으면 err.revert = { name, args, signature }를 채워준다.
  const name = err?.revert?.name ?? err?.errorName;
  if (name) {
    const friendly = friendlyRevertMessage(name, err.revert?.args, tokenId);
    if (friendly) return friendly;
  }
  // 거부(ACTION_REJECTED)/가스부족/네트워크 오류 등은 ethers가 이미 사람이 읽을 수 있는
  // shortMessage를 주므로 그대로 쓴다.
  return err?.shortMessage || err?.reason || err?.message || "온체인 등록에 실패했습니다.";
}

export async function registerMandateOnChain({ tokenId, maxPerTx, delegationValue, delegationUnit, selectedVendors }) {
  if (!window.ethereum) throw new Error("MetaMask가 설치되어 있지 않습니다.");
  if (!Number.isFinite(Number(tokenId))) throw new Error("tokenId를 확인할 수 없어 온체인 등록을 진행할 수 없습니다.");

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const wrapper = new Contract(PBM_WRAPPER_ADDRESS, SET_MANDATE_ABI, signer);

  const autoLimit = parseUnits(String(Number(maxPerTx) || 0), 6);
  const durationSeconds = delegationUnit === "hour" ? Number(delegationValue) * 3600 : Number(delegationValue) * 86400;
  const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;
  const allowedVendors = selectedVendors.map((key) => VENDOR_ONCHAIN_ADDRESS[key]).filter(Boolean);
  const condition = { agentAddress: HARDCODED_AGENT_ADDRESS, autoLimit, expiresAt, allowedVendors };

  try {
    // 먼저 staticCall로 시뮬레이션한다 — 실제 전송(estimateGas 경유) 실패 시엔 ethers가
    // 커스텀 에러를 못 읽고 "execution reverted (unknown custom error)"만 주지만,
    // staticCall 실패는 err.revert.name까지 정확히 채워줘서 여기서 먼저 걸러야
    // NotTokenOwner 같은 이유를 안내할 수 있다. 성공하면 가스 걱정 없이 그대로 전송.
    await wrapper.setMandateCondition.staticCall(tokenId, condition);
  } catch (err) {
    throw new Error(decodeSetMandateError(err, tokenId), { cause: err });
  }

  try {
    const tx = await wrapper.setMandateCondition(tokenId, condition);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  } catch (err) {
    throw new Error(decodeSetMandateError(err, tokenId), { cause: err });
  }
}
