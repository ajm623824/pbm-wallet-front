import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { signMandate, hashMandatePayload } from "./api/mandateSigner";
import { registerMandateOnChain } from "./api/pbmContract";
import { createMandate, deleteMandate, getNotifications, getMandates, getAgents, createAgent, revokeAgent, getPendingTasks, approveTask, rejectTask, getPBM, getPayments } from "./api/agentClient";
import { buildLogsFromPayments, buildProjectsFromPayments } from "./data/paymentTransform";
import { normalizeVendorKey } from "./data/vendorOptions";
import ConnectPage from "./pages/ConnectPage";
import Sidebar from "./components/Sidebar";
import NotificationPanel from "./components/NotificationPanel";
import WalletPage from "./pages/WalletPage";
import TxLogPage from "./pages/TxLogPage";
import PolicySettingsPage from "./pages/PolicySettingsPage";
import PolicyListPage from "./pages/PolicyListPage";
import AgentPage from "./pages/AgentPage";
import MyProjectPage from "./pages/MyProjectPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import { mockPBM, mockMandates, mockProjects, mockPendingTasks, mockAgents, mockNotifications, mockLogs } from "./data/mockData";

function delegationExpiryFrom(value, unit) {
  const d = new Date();
  if (unit === "day") d.setDate(d.getDate() + Number(value || 0));
  else d.setHours(d.getHours() + Number(value || 0));
  return d.toISOString().slice(0, 16).replace("T", " ");
}

// id 기준으로 서버 응답을 로컬 목록에 합친다 — 이미 있는 id는 서버 값으로 덮어써
// 갱신하고(예: Cloudflare 실결제 완료로 status/url이 바뀐 경우), 로컬에만 있던
// mock 항목(다른 벤더처럼 아직 실결제가 안 되는 것들)은 그대로 남긴다.
function mergeById(prev, incoming) {
  if (!Array.isArray(incoming)) return prev;
  const map = new Map(prev.map((item) => [item.id, item]));
  const newOnes = [];
  incoming.forEach((item) => {
    if (map.has(item.id)) map.set(item.id, { ...map.get(item.id), ...item });
    else newOnes.push(item);
  });
  return [...newOnes, ...Array.from(map.values())];
}

export default function App() {
  const [page, setPage] = useState("wallet");
  const [devMode, setDevMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mandates, setMandates] = useState(mockMandates);
  const [projects, setProjects] = useState(mockProjects);
  const [pendingTasks, setPendingTasks] = useState(mockPendingTasks);
  const [agents, setAgents] = useState(mockAgents);
  const [pbm, setPbm] = useState(mockPBM);
  // 실 결제 이력(GET /api/users/{wallet}/payments) 원본. mockLogs는 그대로 두고
  // 이 배열에서 변환한 항목을 이어붙여서(logs/실 프로젝트) 화면에 "추가"로 보여준다.
  const [payments, setPayments] = useState([]);
  const [savingMandate, setSavingMandate] = useState(false);
  // 알림 — 처음엔 mock으로 채워두고, 이후엔 앱에서 실제로 일어나는 행동(Mandate 생성,
  // 승인/거부, Agent 등록 등)이 생길 때마다 pushNotification으로 새 알림을 쌓는다.
  // 백엔드 붙으면 이 초기값을 GET /api/notifications 응답으로 교체하면 된다.
  const [notifications, setNotifications] = useState(mockNotifications.map((n) => ({ ...n, read: true })));
  const unreadCount = notifications.filter((n) => !n.read).length;

  const pushNotification = (type, msg) => {
    const time = new Date().toTimeString().slice(0, 5);
    setNotifications((prev) => [{ id: `n_${Date.now()}`, type, time, msg, read: false }, ...prev].slice(0, 30));
  };

  const handleToggleNotif = (next) => {
    setNotifOpen(next);
    if (next) setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const {
    address, shortAddress, tokenBalance, tokenSymbol, chainId, signer,
    session, isAuthenticated, isInitializing, isLoading, authAction, error,
    connectWallet, disconnectWallet, registerPasskey, stepUpWithPasskey, refreshBalances,
  } = useAuth();

  // 알림 폴링 — 15초마다 GET /api/notifications를 물어봐서 다른 경로(예: Agent가
  // 자율승인 한도를 넘어 새 승인 대기를 만든 경우)에서 생긴 알림도 받아온다.
  // 로컬 액션(pushNotification)으로 이미 쌓인 알림은 그대로 두고, 서버에서 온 것 중
  // 아직 없는 id만 새로 합친다. 백엔드 라우트가 아직 없으면 조용히 실패하고 다음
  // 주기에 다시 시도한다 — 로컬 알림 동작에는 영향 없음.
  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    const POLL_MS = 15000;

    const poll = async () => {
      try {
        const serverNotifications = await getNotifications(address);
        if (cancelled || !Array.isArray(serverNotifications)) return;
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const fresh = serverNotifications
            .filter((n) => !existingIds.has(n.id))
            .map((n) => ({ ...n, read: false }));
          if (fresh.length === 0) return prev;
          return [...fresh, ...prev].slice(0, 30);
        });
      } catch {
        // 백엔드 미배포 / 라우트 미구현 — 다음 주기에 다시 시도
      }
    };

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [address]);

  // 초기 데이터 로딩 + 수동 새로고침(풀 투 리프레시)에서 공용으로 쓰는 함수.
  // 서버 응답을 mergeById로 합쳐서, 성공한 항목만 갱신되고 나머지 mock은
  // 그대로 유지된다 — 예를 들어 Cloudflare로 실제 결제가 끝난 프로젝트만
  // 서버가 알고 있어도, 다른 벤더 mock 프로젝트는 지워지지 않고 남아있는다.
  const loadServerData = useCallback(async () => {
    // GET /api/projects는 백엔드팀 확정대로 폐기 — 내 프로젝트 화면은 이제
    // mock + GET /api/users/{wallet}/payments(변환된 값)만으로 채워진다.
    const [mandatesRes, agentsRes, tasksRes, pbmRes, paymentsRes] = await Promise.allSettled([
      getMandates(address),
      getAgents(address),
      getPendingTasks(address),
      getPBM(address),
      getPayments(address),
    ]);
    if (mandatesRes.status === "fulfilled") setMandates((prev) => mergeById(prev, mandatesRes.value));
    if (agentsRes.status === "fulfilled") setAgents((prev) => mergeById(prev, agentsRes.value));
    if (tasksRes.status === "fulfilled") setPendingTasks((prev) => mergeById(prev, tasksRes.value));
    // PBM은 단일 객체라 mergeById 대신 필드 단위로 덮어쓴다 — 서버가 안 주는 필드는 mock 값이 남는다.
    // allowedVendors는 서버가 "kt"처럼 프론트 내부 키("kt_cloud")와 다른 축약형으로 줄 수 있어
    // 화이트리스트 비교(MandateForm)가 깨지지 않게 여기서 정규화해서 저장한다.
    if (pbmRes.status === "fulfilled" && pbmRes.value) {
      const normalized = Array.isArray(pbmRes.value.allowedVendors)
        ? { ...pbmRes.value, allowedVendors: pbmRes.value.allowedVendors.map(normalizeVendorKey) }
        : pbmRes.value;
      setPbm((prev) => ({ ...prev, ...normalized }));
    }
    // 결제 이력은 txHash 기준으로 새 항목만 추가(같은 tx 재조회 시 최신 status로 갱신).
    if (paymentsRes.status === "fulfilled" && Array.isArray(paymentsRes.value)) {
      setPayments((prev) => {
        const map = new Map(prev.map((p) => [p.txHash, p]));
        paymentsRes.value.forEach((p) => { if (p?.txHash) map.set(p.txHash, { ...map.get(p.txHash), ...p }); });
        return Array.from(map.values());
      });
    }
  }, [address]);

  // 거래내역/대시보드/Agent/My지갑에서 공용으로 쓰는 결제 로그. mockLogs(데모용)는
  // 그대로 두고, 실 결제 이력을 변환해 앞에 붙인다 — 최신 실데이터가 위로, mock은
  // 아래로 남아 "삭제되지 않고 추가"되는 형태.
  const logs = [...buildLogsFromPayments(payments), ...mockLogs];
  // 내 프로젝트 화면 — mock + 승인 처리로 로컬에 추가된 항목(projects state)에
  // 결제 이력에서 뽑아낸 항목을 추가로 이어붙인다. id 프리픽스(pay_)가 달라 중복되지 않는다.
  const projectsWithPayments = [
    ...projects,
    ...buildProjectsFromPayments(payments, new Set(projects.map((p) => p.id))),
  ];

  // 초기 로딩 — 지갑 연결되면 한 번 시도. 실패(백엔드 미배포 등)해도 지금 보이는
  // mock을 그대로 두니 화면이 비거나 깨지는 일은 없다.
  useEffect(() => {
    if (!address) return;
    const timer = window.setTimeout(() => loadServerData().catch(() => {}), 0);
    return () => window.clearTimeout(timer);
  }, [address, loadServerData]);

  // 풀 투 리프레시 대신 "자동 갱신 + 수동 새로고침 버튼" 조합 — 지갑 잔액 +
  // Mandate/Agent/프로젝트/승인대기 목록을 한 번에 다시 조회해서 합친다.
  // 대시보드/My 지갑/거래내역 헤더의 RefreshStatus가 이 함수를 자동(주기)/수동(클릭) 둘 다에서 호출한다.
  const handleRefresh = async () => {
    await Promise.allSettled([refreshBalances?.(), loadServerData()]);
  };

  if (isInitializing) {
    return <div style={{ height: "100vh", display: "grid", placeItems: "center", color: "#64748B", fontWeight: 700 }}>세션 확인 중…</div>;
  }

  if (!isAuthenticated) {
    return <ConnectPage onConnect={connectWallet} isLoading={isLoading} error={error} />;
  }

  // 정책 설정(MandateForm) 저장 — PBM 화이트리스트 부분집합으로 위임을 만들고,
  // 실제로 MetaMask 서명을 요청한다(step 1: "이수진이 지갑에서 Mandate 생성 및 서명").
  // 온체인 PBM 컨트랙트 실행/실제 위임 등록(step 2)은 백엔드 + 컨트랙트 영역이라
  // 프론트만으로는 재현할 수 없어, 서명 성공 여부만 mandate.status에 반영한다.
  const handleSaveMandate = async (form) => {
    const mandateId = `mnd_${Date.now()}`;
    // 백엔드 스펙(POST /api/mandates)이 camelCase라 필드명을 맞춘다.
    const payload = {
      mandateId,
      payerWallet: address,
      agentAddress: null, // Agent 등록은 백엔드 연동 후 채워짐
      selectedVendors: form.selectedVendors,
      totalBudget: Number(form.totalBudget) || 0,
      maxPerTx: Number(form.maxPerTx) || 0,
      dailyLimit: Number(form.dailyLimit) || 0,
      delegationValue: form.delegationValue,
      delegationUnit: form.delegationUnit,
    };
    const signablePayload = JSON.stringify(payload);

    setSavingMandate(true);
    let signature = null;
    let signError = null;
    try {
      signature = await signMandate(signablePayload, hashMandatePayload(signablePayload), address);
    } catch (err) {
      signError = err.message;
    }

    // 서명이 끝난 Mandate는 서버에 저장을 시도한다(POST /api/mandates).
    // 백엔드가 아직 배포 전이라 실패할 수 있는데, 그 경우 데모/개발이 막히지 않도록
    // 로컬에는 그대로 반영하되 syncError로 "저장 안 됨" 상태를 남겨 화면에 표시한다.
    let serverResult = null;
    let syncError = null;
    if (signature) {
      try {
        serverResult = await createMandate(payload, signature);
      } catch (err) {
        syncError = err.message;
      }
    }

    // 온체인 등록(setMandateCondition) — 실제 트랜잭션이라 MetaMask가 승인 팝업을 띄운다.
    // Agent 연결 UI가 아직 없어서 Agent 지갑은 pbmContract.js에 하드코딩돼 있다(시나리오 1개용).
    let chainTxHash = null;
    let chainError = null;
    if (signature) {
      try {
        const chainResult = await registerMandateOnChain({
          tokenId: pbm?.tokenId,
          maxPerTx: form.maxPerTx,
          delegationValue: form.delegationValue,
          delegationUnit: form.delegationUnit,
          selectedVendors: form.selectedVendors,
        });
        chainTxHash = chainResult.txHash;
      } catch (err) {
        chainError = err.shortMessage || err.message;
      }
    }
    setSavingMandate(false);

    const newMandate = {
      id: serverResult?.mandateId || mandateId,
      name: form.name || "이름 없는 위임",
      status: signature ? "active" : "pending_signature",
      createdAt: new Date().toISOString().slice(0, 10),
      agentAddress: null,
      selectedVendors: form.selectedVendors,
      totalBudget: form.totalBudget,
      maxPerTx: form.maxPerTx,
      dailyLimit: form.dailyLimit,
      delegationValue: form.delegationValue,
      delegationUnit: form.delegationUnit,
      delegationExpiresAt: delegationExpiryFrom(form.delegationValue, form.delegationUnit),
      signError,
      syncError,
      chainTxHash,
      chainError,
    };
    setMandates((prev) => [newMandate, ...prev]);

    if (!signature) {
      pushNotification("fail", `${newMandate.name} — MetaMask 서명 실패`);
    } else if (chainError) {
      pushNotification("fail", `${newMandate.name} — 온체인 등록 실패: ${chainError}`);
    } else if (syncError) {
      pushNotification("fail", `${newMandate.name} — 서명은 완료됐지만 서버 저장 실패`);
    } else {
      pushNotification("done", `${newMandate.name} — Mandate 생성 완료 (온체인 등록됨)`);
    }

    setPage("policy_list");
  };

  const handleDeleteMandate = (id) => {
    const target = mandates.find((m) => m.id === id);
    setMandates((prev) => prev.filter((m) => m.id !== id));
    // 서버에도 철회 요청 — 백엔드 미배포 시 실패해도 화면 목록에서는 이미 지워진 상태라 무시.
    deleteMandate(id).catch(() => {});
    pushNotification("info", `${target?.name || "Mandate"} 철회됨`);
  };

  const handleApproveTask = (id) => {
    const task = pendingTasks.find((t) => t.id === id);
    setPendingTasks((prev) => prev.filter((t) => t.id !== id));
    if (task) {
      setProjects((prev) => [
        { id: `prj_${Date.now()}`, name: task.instruction, vendor: task.vendor, status: "deploying", url: null, deployedAt: null, mandateId: task.mandateId },
        ...prev,
      ]);
      approveTask(id).catch(() => {}); // 백엔드 미배포 시 무시 — 화면은 이미 반영됨
      pushNotification("done", `${task.instruction} — 승인 완료, 배포 시작`);
    }
  };
  const handleRejectTask = (id) => {
    const task = pendingTasks.find((t) => t.id === id);
    setPendingTasks((prev) => prev.filter((t) => t.id !== id));
    if (task) {
      rejectTask(id).catch(() => {});
      pushNotification("fail", `${task.instruction} — 요청 거부됨`);
    }
  };

  // AI Agent 관리
  const handleCreateAgent = (form) => {
    const newAgent = { id: `agent_${Date.now()}`, name: form.name, agentId: crypto.randomUUID?.() ?? `${Date.now()}`, walletAccess: true, spent: 0 };
    setAgents((prev) => [newAgent, ...prev]);
    createAgent({ name: form.name }, address).catch(() => {});
    pushNotification("info", `${form.name} Agent 등록됨`);
  };
  const handleRevokeAgent = (id) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, walletAccess: false } : a)));
    const target = agents.find((a) => a.id === id);
    revokeAgent(id).catch(() => {});
    pushNotification("info", `${target?.name || "Agent"} 지갑 접근 권한 철회됨`);
  };
  const handleDeleteAgent = (id) => setAgents((prev) => prev.filter((a) => a.id !== id));

  const PAGES = {
    dashboard: <DashboardPage pbm={pbm} logs={logs} pendingTasks={pendingTasks} onNavigateLogs={() => setPage("txlog")} onRefresh={handleRefresh} />,
    policy_settings: <PolicySettingsPage pbm={pbm} onSave={handleSaveMandate} onCancel={() => setPage("policy_list")} saving={savingMandate} />,
    policy_list: <PolicyListPage mandates={mandates} onCreate={() => setPage("policy_settings")} onDelete={handleDeleteMandate} />,
    agent: (
      <AgentPage
        agents={agents}
        mandates={mandates}
        pendingTasks={pendingTasks}
        logs={logs}
        tokenId={pbm?.tokenId}
        onCreateAgent={handleCreateAgent}
        onDeleteAgent={handleDeleteAgent}
        onRevokeAgent={handleRevokeAgent}
        onDeleteMandate={handleDeleteMandate}
        onApproveTask={handleApproveTask}
        onRejectTask={handleRejectTask}
      />
    ),
    krwc_wallet_mock: (
  <div style={{ padding: "36px 48px" }}>
    <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>KRWC 지갑</div>
    <div style={{ color: "#999" }}>준비 중입니다.</div>
  </div>
),
    my_project: <MyProjectPage projects={projectsWithPayments} agents={agents} mandates={mandates} devMode={devMode} />,
    txlog: <TxLogPage logs={logs} onRefresh={handleRefresh} devMode={devMode} />,
    wallet: <WalletPage walletAddress={address} tokenBalance={tokenBalance} tokenSymbol={tokenSymbol} chainId={chainId} agents={agents} logs={logs} onRefresh={handleRefresh} signer={signer} isAuthenticated={isAuthenticated} pendingTasks={pendingTasks} pbm={pbm} />,
    settings: (
      <SettingsPage
        address={address}
        chainId={chainId}
        session={session}
        authAction={authAction}
        authError={error}
        onRegisterPasskey={registerPasskey}
        onStepUp={stepUpWithPasskey}
        onDisconnect={disconnectWallet}
      />
    ),
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      background: "#F4F6F8",
    }}>
      <Sidebar
        current={page}
        onChange={(p) => { setPage(p); handleToggleNotif(false); }}
        address={shortAddress}
        onDisconnect={disconnectWallet}
        pendingCount={pendingTasks.length}
        devMode={devMode}
        onToggleDevMode={() => setDevMode((v) => !v)}
      />
      <main style={{
        flex: 1,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        minWidth: 0,
      }}>
        {/* main 자체를 기준점(position:relative)으로 쓰면 그 기준점이 스크롤 상자와
           같아서 절대/고정 위치인 벨이 스크롤과 무관하게 안 움직인다. 그래서 기준점을
           스크롤되는 콘텐츠 쪽(이 wrapper)으로 옮겨서, 스크롤하면 벨도 같이 딸려 올라가
           화면 밖으로 사라지게 한다. */}
        <div style={{ position: "relative", minHeight: "100%" }}>
          <NotificationPanel open={notifOpen} onClose={handleToggleNotif} notifications={notifications} unreadCount={unreadCount} />
          {PAGES[page]}
        </div>
      </main>
    </div>
  );
}
