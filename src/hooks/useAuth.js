import { useCallback, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { getWalletBalance } from "../api/agentClient";
import { getSession, logout, registerPasskey, signInWithEthereum, stepUpWithPasskey } from "../api/authClient";

function messageFor(error) {
  if (error?.code === 4001 || error?.info?.error?.code === 4001 || error?.name === "NotAllowedError") return "요청을 취소했습니다.";
  if (error?.status === 501) return "서버에 Passkey 검증이 아직 구성되지 않았습니다.";
  return error?.message || "인증 중 오류가 발생했습니다.";
}

export function useAuth() {
  const [session, setSession] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokenSymbol, setTokenSymbol] = useState("KRWC");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authAction, setAuthAction] = useState(null);
  const [error, setError] = useState(null);

  const loadBalances = useCallback(async (address) => {
    if (!address) return;
    try {
      const data = await getWalletBalance(address);
      setTokenBalance(data?.balance != null ? String(data.balance) : null);
      if (data?.symbol) setTokenSymbol(data.symbol);
    } catch { setTokenBalance(null); }
  }, []);

  const clearLocal = useCallback(() => {
    setSession(null); setProvider(null); setSigner(null); setTokenBalance(null);
  }, []);

  useEffect(() => {
    let active = true;
    getSession()
      .then((value) => { if (active && value) { setSession(value); loadBalances(value.wallet); } })
      .catch((err) => { if (active) setError(messageFor(err)); })
      .finally(() => { if (active) setIsInitializing(false); });
    return () => { active = false; };
  }, [loadBalances]);

  useEffect(() => {
    if (!window.ethereum) return undefined;
    const accountChanged = (accounts) => {
      if (!session?.wallet || !accounts.some((account) => account.toLowerCase() === session.wallet.toLowerCase())) {
        logout().catch(() => {}).finally(clearLocal);
      }
    };
    const chainChanged = () => logout().catch(() => {}).finally(clearLocal);
    window.ethereum.on?.("accountsChanged", accountChanged);
    window.ethereum.on?.("chainChanged", chainChanged);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", accountChanged);
      window.ethereum.removeListener?.("chainChanged", chainChanged);
    };
  }, [session?.wallet, clearLocal]);

  const connectWallet = useCallback(async () => {
    setError(null); setIsLoading(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask가 설치되어 있지 않습니다.");
      const nextProvider = new BrowserProvider(window.ethereum);
      await nextProvider.send("eth_requestAccounts", []);
      const nextSigner = await nextProvider.getSigner();
      const wallet = await nextSigner.getAddress();
      const network = await nextProvider.getNetwork();
      const nextSession = await signInWithEthereum({ signer: nextSigner, wallet, chainId: Number(network.chainId) });
      setProvider(nextProvider); setSigner(nextSigner); setSession(nextSession);
      await loadBalances(nextSession.wallet);
    } catch (err) { setError(messageFor(err)); }
    finally { setIsLoading(false); }
  }, [loadBalances]);

  const disconnectWallet = useCallback(async () => {
    setError(null);
    try { await logout(); } catch (err) { setError(messageFor(err)); }
    finally { clearLocal(); }
  }, [clearLocal]);

  const runPasskeyAction = useCallback(async (action, fn) => {
    setAuthAction(action); setError(null);
    try {
      const result = await fn();
      if (action === "step-up") setSession((current) => ({ ...current, ...result, stepUpRequired: false }));
      return true;
    } catch (err) { setError(messageFor(err)); return false; }
    finally { setAuthAction(null); }
  }, []);

  const address = session?.wallet || null;
  const chainId = session?.chainId || null;
  return {
    provider, signer, session, address, chainId, tokenBalance, tokenSymbol,
    shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
    isAuthenticated: Boolean(session), isInitializing, isLoading, authAction, error,
    connectWallet, disconnectWallet,
    registerPasskey: () => runPasskeyAction("register", registerPasskey),
    stepUpWithPasskey: () => runPasskeyAction("step-up", stepUpWithPasskey),
    refreshBalances: () => loadBalances(address),
  };
}
