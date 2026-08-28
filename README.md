<<<<<<< HEAD
# 🔐 PBM Wallet

> 정부 지원 클라우드 인프라 바우처(PBM)를 AI Agent에게 위임하고, 정해진 조건 안에서 Agent가 자율적으로 클라우드 배포 결제를 실행하는 지갑 서비스

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![ethers.js](https://img.shields.io/badge/ethers.js-v6-2535A0)
![License](https://img.shields.io/badge/license-private-lightgrey)

---

## 📖 개요

- 사용자는 **MetaMask**로 지갑을 연결하고, PBM 화이트리스트 안에서 예산·한도·기간을 정해 **Mandate**(위임 조건)를 만듭니다.
- **AI Agent**는 그 Mandate 범위 안에서 자율적으로 클라우드 벤더에 배포 결제를 실행합니다. (현재 실제 온체인 결제는 **Cloudflare**만 가능)
- Mandate의 자율승인 한도를 초과하는 요청은 자동 실행되지 않고 **사용자 승인 대기** 상태가 됩니다.

```
사용자(MetaMask) ──서명──▶ Mandate 생성
                                │
                                ▼
                 Agent(자체 지갑) ──서명──▶ 클라우드 결제 실행
                                          (Mandate 조건 안에서만 자율 실행)
```

## 🛠 기술 스택

| 분류 | 사용 기술 |
| --- | --- |
| 프레임워크 | React 19 + Vite |
| 지갑 연동 | ethers.js v6 (MetaMask 연결, Mandate 서명) |
| 아이콘 | Tabler Icons (webfont) |
| 스타일 | 순수 inline style (별도 CSS 프레임워크 없음) |

## 🚀 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 프로덕션 빌드
npm run build
```

## ⚙️ 환경 변수

`.env` (또는 `.env.local`)에 아래 값을 설정하세요. 미설정 시 `http://localhost:8000`을 기본값으로 사용합니다.

```env
VITE_AGENT_BACKEND_URL=http://localhost:8000
```

## 📁 폴더 구조

```
src/
├── api/          # 백엔드 통신(agentClient.js), Mandate 서명 로직(mandateSigner.js)
├── components/   # 재사용 UI 컴포넌트 (MandateForm, Sidebar, Timeline, NotificationPanel ...)
├── data/         # mock 데이터(mockData.js) — 백엔드 응답으로 점진적으로 대체 중
├── hooks/        # useWallet — MetaMask 연결/잔액/네트워크 상태 관리
└── pages/        # 화면 단위 페이지
```

## 🗂 페이지

| 페이지 | 설명 |
| --- | --- |
| **My 지갑** | MetaMask 지갑 주소 · USDC 잔액 · 최근 활동 |
| **Mandate 생성 / 목록** | Agent에게 위임할 결제 조건(벤더 · 예산 · 기간) 설정 및 관리 |
| **AI Agent** | 등록된 Agent 목록, 승인 대기 요청 처리 |
| **거래 내역** | 결제/배포 로그 및 단계별 타임라인 |
| **대시보드** | 정부 지원 한도 사용 현황, 벤더별 사용 비중, 배포 상태 분포 |
| **내 프로젝트** | Agent가 배포한 프로젝트 목록 |
| **설정** | 지갑 연결 해제 등 |

## 🔌 백엔드 연동 상태

현재 화면은 **mock 데이터를 기본값으로 깔아둔 채, 백엔드 API 호출이 성공하면 그 결과로 갱신**되는 방식입니다. 백엔드가 아직 없거나 특정 엔드포인트가 실패해도 화면은 mock으로 정상 동작합니다.

`src/api/agentClient.js`에 필요한 API 함수가 전부 정의되어 있습니다.

| 상태 | 대상 |
| --- | --- |
| ✅ 화면에 연결됨 | 지갑 잔액 · Mandate 생성/삭제/조회 · Agent 조회/등록/철회 · 프로젝트 조회 · 승인대기 조회/승인/거부 · 알림(15초 폴링) |
| ⏳ 함수만 준비됨 | PBM 정보 · 대시보드 요약 · 거래 내역 · Agent 실행 지시 |

대시보드 / My 지갑 / 거래 내역 페이지는 **45초 자동 갱신 + 새로고침 버튼**(`RefreshStatus`)을 제공합니다.

## 📝 참고

- `src/api/types.js` — 백엔드와 맞춰야 할 API 요청/응답 필드에 대한 JSDoc 참고 문서입니다. 백엔드 스펙이 확정되면 여기부터 갱신하세요.
- Cloudflare 외 벤더는 아직 실제 온체인 결제가 불가능하여, mock 데이터로 표시되는 프로젝트/로그가 실제 데이터와 함께 남아있을 수 있습니다.
- 사이드바 "설정" 메뉴를 0.8초 안에 3번 연속 클릭하면 개발자 모드가 켜집니다 — 거래내역/내 프로젝트에서 특정 항목을 사용자 화면에서 숨길 수 있는 숨은 기능입니다.
>>>>>>> 18554b284dc30169f2d1efd2d0c1012eb3518323
