// 화면(KRWC)에는 "KRWC"로 보이지만, 실제로 온체인에서 오가는 토큰은
// Base Sepolia 테스트넷에 배포된 이 USDC(호환) 컨트랙트다.
// 표준 ERC-20이라 커스텀 ABI 없이 필요한 함수 4개(balanceOf/decimals/symbol/transfer)만
// 들고 있으면 이체/충전 구현에 충분하다.
export const TOKEN_CONTRACT_ADDRESS = "0x2B313076BB5E0CcA650E387442ac024b17d30927";

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export const BASE_SEPOLIA_CHAIN_ID = 84532;
