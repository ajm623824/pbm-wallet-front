import { useState, Fragment } from "react";
import { VENDOR_OPTIONS } from "../data/vendorOptions";

const DELEGATION_QUICK_OPTIONS = [
  { value: 1, unit: "hour", label: "1시간" },
  { value: 6, unit: "hour", label: "6시간" },
  { value: 12, unit: "hour", label: "12시간" },
  { value: 1, unit: "day", label: "1일" },
  { value: 7, unit: "day", label: "7일" },
  { value: 30, unit: "day", label: "30일" },
];

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1.5px solid #F0F0F0",
  borderRadius: 12,
  fontSize: 14,
  background: "#FAFAFA",
  color: "#111",
};

function FieldLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 8 }}>
      {children}
      <i className="ti ti-help-circle" style={{ fontSize: 13, color: "#ccc" }} />
    </div>
  );
}

function SuffixInput({ value, onChange, placeholder, suffix, big, error }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          paddingRight: 44,
          ...(big ? { fontSize: 18, padding: "16px 44px 16px 16px", fontWeight: 700 } : {}),
          ...(error ? { border: "1.5px solid #E02020" } : {}),
        }}
      />
      <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: big ? 15 : 13, color: "#bbb", pointerEvents: "none" }}>
        {suffix}
      </span>
    </div>
  );
}

function VendorMark({ vendorKey }) {
  if (vendorKey === "cloudflare") {
    return (
      <svg viewBox="0 0 64 40" width="60" height="38">
        <path d="M45 30c6.6 0 12-5.4 12-12s-5.4-12-12-12c-1.1 0-2.1.1-3.1.4C40.1 2.6 34.9 0 29 0c-8.6 0-15.6 6.6-16.4 15C6.3 15.4 1 20.7 1 27.2 1 27.5 1 27.7 1 28h44v2Z" fill="#F6821F"/>
        <path d="M50 34H14c-3 0-5.4-2.4-5.4-5.4S11 23.2 14 23.2h36c3 0 5.4 2.4 5.4 5.4S53 34 50 34Z" fill="#FBAD41"/>
      </svg>
    );
  }
  if (vendorKey === "kt_cloud") {
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 3, fontFamily: "-apple-system, sans-serif" }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: "#111", letterSpacing: "-1px" }}>kt</span>
        <span style={{ fontSize: 24, fontWeight: 800, color: "#E4032E", letterSpacing: "-0.5px" }}>cloud</span>
      </div>
    );
  }
  if (vendorKey === "ncp") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.02 }}>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#03C75A", letterSpacing: "0.5px" }}>NAVER</span>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#03C75A" }}>Cloud</span>
      </div>
    );
  }
  if (vendorKey === "aws") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: "#232F3E", letterSpacing: "-0.5px" }}>aws</span>
        <svg viewBox="0 0 60 14" width="52" height="12" style={{ marginTop: 1 }}>
          <path d="M2 4c10 8 40 8 56 0" stroke="#FF9900" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M52 2l7 2.2-4 6" stroke="#FF9900" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (vendorKey === "azure") {
    return (
      <svg viewBox="0 0 48 44" width="38" height="34">
        <path d="M18 2h11L15 30l-15 8L18 2Z" fill="#0078D4" />
        <path d="M19 2h10l1 1L15 33l-12 3L19 2Z" fill="#50E6FF" opacity="0.55" />
        <path d="M29 2 47 38H36l-9-19 2-17Z" fill="#0078D4" />
      </svg>
    );
  }
  return null;
}

const STEP_META = [
  { key: "name", title: "AI에게 어떤 일을 맡길까요?", shortLabel: "위임 이름", desc: "AI Agent가 사용할 권한을 쉽게 구분할 수 있도록 이름을 정해주세요." },
  { key: "vendors", title: "AI가 사용할 클라우드 서비스를 선택해주세요", shortLabel: "업체 선택", desc: "사용 가능한 클라우드" },
  { key: "budget", title: "AI가 사용할 수 있는 금액을 정해주세요", shortLabel: "예산 설정", desc: "총 예산 및 지출 한도를 설정하여 예산을 관리하세요." },
  { key: "runtime", title: "AI가 돈을 언제까지 쓸 수 있게 할까요?", shortLabel: "위임기간", desc: "Agent가 자율적으로 실행할 수 있는 기간을 정하세요. 기간이 지나면 위임이 만료됩니다." },
];

// govWhitelist: PBM(정부)이 허용한 벤더 key 배열. 이 안에서만 선택 가능하며,
// 화면에도 "정부 화이트리스트 외"인 벤더는 잠금 표시로 구분해서 보여준다.
export default function MandateForm({ initial, govWhitelist = [], onCancel, onSave, submitLabel = "저장", saving = false }) {
  const [name, setName] = useState(initial?.name || "");
  const [selectedVendors, setSelectedVendors] = useState(initial?.selectedVendors || []);
  const [totalBudget, setTotalBudget] = useState(initial?.totalBudget ?? "");
  const [maxPerTx, setMaxPerTx] = useState(initial?.maxPerTx ?? "");
  const [dailyLimit, setDailyLimit] = useState(initial?.dailyLimit ?? "");
  const [delegationUnit, setDelegationUnit] = useState(initial?.delegationUnit || "day");
  const [delegationValue, setDelegationValue] = useState(initial?.delegationValue ?? 7);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState("forward");
  const lastStep = STEP_META.length - 1;

  const toggleVendor = (key) => {
    if (!govWhitelist.includes(key)) return; // PBM 화이트리스트 외 벤더는 선택 불가
    setSelectedVendors((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const isNameValid = name.trim().length > 0;
  const isDelegationValid = String(delegationValue).trim() !== "" && Number(delegationValue) >= 1;

  const totalBudgetNum = Number(totalBudget) || 0;
  const maxPerTxNum = Number(maxPerTx) || 0;
  const dailyLimitNum = Number(dailyLimit) || 0;
  const budgetErrors = [];
  if (totalBudgetNum > 0 && maxPerTxNum > totalBudgetNum) {
    budgetErrors.push({ field: "maxPerTx", message: "1회 결제 최대 금액은 총 예산을 넘을 수 없습니다." });
  }
  if (totalBudgetNum > 0 && dailyLimitNum > totalBudgetNum) {
    budgetErrors.push({ field: "dailyLimit", message: "일일 지출 한도는 총 예산을 넘을 수 없습니다." });
  }
  if (dailyLimitNum > 0 && maxPerTxNum > dailyLimitNum) {
    budgetErrors.push({ field: "maxPerTx", message: "1회 결제 최대 금액은 일일 지출 한도보다 클 수 없습니다." });
  }
  const isBudgetValid = budgetErrors.length === 0;
  const hasFieldError = (field) => budgetErrors.some((e) => e.field === field);

  const hasStepInput = () => {
    switch (step) {
      case 1: return selectedVendors.length > 0;
      case 2: return String(totalBudget).trim() !== "" || String(maxPerTx).trim() !== "" || String(dailyLimit).trim() !== "";
      case 3: return String(delegationValue).trim() !== "";
      default: return true;
    }
  };

  const handleSave = () => {
    onSave?.({ name, selectedVendors, totalBudget, maxPerTx, dailyLimit, delegationUnit, delegationValue });
  };

  const goNext = () => {
    if (step === 0 && !isNameValid) return;
    if (step === lastStep) { handleSave(); return; }
    setDir("forward");
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) { onCancel?.(); return; }
    setDir("backward");
    setStep((s) => s - 1);
  };

  const meta = STEP_META[step];
  const unitLabel = delegationUnit === "hour" ? "시간" : "일";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <style>{`
        @keyframes pbmSlideFromRight { from { transform: translateX(28px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pbmSlideFromLeft  { from { transform: translateX(-28px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      {/* 상단: 뒤로가기 + 단계 스텝퍼 */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 26 }}>
        <button
          onClick={goBack}
          style={{ width: 34, height: 34, borderRadius: 10, border: "1.5px solid #F0F0F0", background: "#fff", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 16 }} />
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-start" }}>
          {STEP_META.map((s, i) => (
            <Fragment key={s.key}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 72 }}>
                <div
                  style={{
                    width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                    background: i <= step ? "#3182F6" : "#fff",
                    color: i <= step ? "#fff" : "#bbb",
                    border: i <= step ? "none" : "1.5px solid #E4E6E8",
                    transition: "all 0.2s ease",
                  }}
                >
                  {i < step ? <i className="ti ti-check" style={{ fontSize: 12 }} /> : i + 1}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: i === step ? 800 : 600, color: i === step ? "#3182F6" : i < step ? "#888" : "#ccc", marginTop: 6, textAlign: "center", lineHeight: 1.25, transition: "color 0.2s ease" }}>
                  {s.shortLabel}
                </div>
              </div>
              {i < STEP_META.length - 1 && (
                <div style={{ flex: 1, height: 2, marginTop: 13, background: i < step ? "#3182F6" : "#E4E6E8", transition: "background 0.2s ease" }} />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* 스텝 콘텐츠 */}
      <div
        key={step}
        style={{
          background: "#fff", borderRadius: 18, padding: "28px 30px", marginBottom: 16, minHeight: 380,
          animation: `${dir === "forward" ? "pbmSlideFromRight" : "pbmSlideFromLeft"} 0.28s ease`,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 4 }}>{meta.title}</div>
        <div style={{ fontSize: 12.5, color: "#bbb", marginBottom: 26 }}>{meta.desc}</div>

        {/* Step 0: 위임 이름 */}
        {step === 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>권한 이름</span>
              <span style={{ fontSize: 11, color: "#ccc" }}>{name.length} / 50</span>
            </div>
            <input
              autoFocus
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 상품 이미지 생성 AI 배포용 위임"
              style={{ ...inputStyle, fontSize: 16, padding: "16px 16px" }}
            />
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 8 }}>이 이름으로 AI에게 부여한 자금 사용 권한을 관리합니다.</div>
          </div>
        )}

        {/* Step 1: 클라우드 벤더 선택 (PBM 화이트리스트 안에서만) */}
        {step === 1 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <FieldLabel>사용할 클라우드 서비스</FieldLabel>
              <span style={{ fontSize: 12, color: "#bbb", fontWeight: 600 }}>
                선택됨 <span style={{ color: selectedVendors.length ? "#3182F6" : "#bbb", fontWeight: 800 }}>{selectedVendors.length}</span> / {govWhitelist.length}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
              {VENDOR_OPTIONS.map((v) => {
                const allowed = govWhitelist.includes(v.key);
                const active = selectedVendors.includes(v.key);
                return (
                  <button
                    key={v.key}
                    type="button"
                    disabled={!allowed}
                    onClick={() => toggleVendor(v.key)}
                    title={!allowed ? "PBM(정부) 화이트리스트 외 — 선택 불가" : undefined}
                    style={{
                      position: "relative", minWidth: 0, width: "100%", padding: "16px 8px 12px", borderRadius: 14, minHeight: 118,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      border: active ? "1.5px solid #3182F6" : "1.5px solid #EDEDED",
                      background: !allowed ? "#F8F9FA" : active ? "#EEF4FF" : "#fff",
                      cursor: allowed ? "pointer" : "not-allowed",
                      opacity: allowed ? 1 : 0.55,
                      textAlign: "center", overflow: "hidden", transition: "border-color 0.12s, background 0.12s",
                    }}
                  >
                    {!allowed && (
                      <i className="ti ti-lock" style={{ position: "absolute", top: 8, right: 8, fontSize: 11, color: "#bbb" }} />
                    )}
                    {allowed && (
                      <span
                        style={{
                          position: "absolute", top: 8, left: 8, width: 13, height: 13, borderRadius: 4, flexShrink: 0,
                          border: active ? "none" : "1.5px solid #ddd", background: active ? "#3182F6" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {active && <i className="ti ti-check" style={{ fontSize: 8, color: "#fff" }} />}
                      </span>
                    )}
                    <div style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <VendorMark vendorKey={v.key} />
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111", marginTop: 8, maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.label}</div>
                    <div style={{ fontSize: 10, color: allowed ? "#999" : "#E02020", marginTop: 3, maxWidth: "100%", lineHeight: 1.3, wordBreak: "keep-all" }}>
                      {allowed ? v.subtitle : "화이트리스트 외"}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 14 }}>회색으로 잠긴 벤더는 PBM(정부 발급) 화이트리스트에 없어 선택할 수 없습니다.</div>
            <div style={{ fontSize: 10.5, color: "#ccc", marginTop: 4 }}>Cloudflare®, AWS®, Azure®, NAVER Cloud®, KT Cloud®는 각 소유자의 상표입니다.</div>
          </div>
        )}

        {/* Step 2: 예산 설정 (총 예산 / 1회 결제 최대 금액 / 일일 지출 한도) */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <FieldLabel>총 예산</FieldLabel>
              <SuffixInput value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} placeholder="예) 300,000" suffix="KRWC" big />
              <div style={{ fontSize: 11, color: "#ccc", marginTop: 6 }}>
                이 위임에 배정할 총 예산입니다 (PBM 총 한도 중 일부). · 1 KRWC = 1원
              </div>
            </div>
            <div>
              <FieldLabel>한번에 최대</FieldLabel>
              <SuffixInput value={maxPerTx} onChange={(e) => setMaxPerTx(e.target.value)} placeholder="예) 50,000" suffix="KRWC" error={hasFieldError("maxPerTx")} />
              <div style={{ fontSize: 11, color: "#ccc", marginTop: 6 }}>한 번의 결제에서 사용할 수 있는 최대 금액입니다.</div>
            </div>
            <div>
              <FieldLabel>하루 최대 사용액</FieldLabel>
              <SuffixInput value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} placeholder="예) 100,000" suffix="KRWC" error={hasFieldError("dailyLimit")} />
              <div style={{ fontSize: 11, color: "#ccc", marginTop: 6 }}>하루 동안 사용할 수 있는 최대 금액입니다.</div>
            </div>
            {budgetErrors.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: -6 }}>
                {budgetErrors.map((e) => (
                  <div key={e.field + e.message} style={{ fontSize: 11, color: "#E02020" }}>{e.message}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Agent 위임기간 */}
        {step === 3 && (
          <div>
            <FieldLabel>만료 기간</FieldLabel>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginBottom: 8 }}>빠른 선택</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
              {DELEGATION_QUICK_OPTIONS.map((o) => {
                const on = delegationUnit === o.unit && delegationValue === o.value;
                return (
                  <button
                    key={o.label} type="button"
                    onClick={() => { setDelegationUnit(o.unit); setDelegationValue(o.value); }}
                    style={{ padding: "12px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: on ? "1.5px solid #3182F6" : "1.5px solid #F0F0F0", background: on ? "#EEF4FF" : "#fff", color: on ? "#3182F6" : "#666" }}
                  >
                    {o.label}
                  </button>
                );
              })}
              <button
                type="button"
                style={{ padding: "12px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "default", border: "1.5px solid #3182F6", background: "#EEF4FF", color: "#3182F6", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
              >
                <i className="ti ti-calendar" style={{ fontSize: 13 }} />
                직접 설정
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111", flexShrink: 0 }}>직접 설정</div>
              <input
                type="number"
                min={1}
                step={1}
                value={delegationValue}
                onChange={(e) => {
                  // 앞자리 0 제거(045 → 45) + 숫자만 허용. 빈 값은 입력 도중엔 그대로 두고,
                  // 저장 가능 여부는 isDelegationValid에서 별도로 막는다.
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  const noLeadingZeros = digitsOnly.replace(/^0+(?=\d)/, "");
                  setDelegationValue(noLeadingZeros === "" ? "" : Number(noLeadingZeros));
                }}
                style={{ ...inputStyle, width: 90, ...(isDelegationValid ? {} : { border: "1.5px solid #E02020" }) }}
              />
              <div style={{ position: "relative", width: 110 }}>
                <select
                  value={delegationUnit}
                  onChange={(e) => setDelegationUnit(e.target.value)}
                  style={{ ...inputStyle, width: "100%", appearance: "none", paddingRight: 30, cursor: "pointer" }}
                >
                  <option value="hour">시간</option>
                  <option value="day">일</option>
                </select>
                <i className="ti ti-chevron-down" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#999", pointerEvents: "none" }} />
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, background: "#EEF4FF", borderRadius: 14, padding: "10px 18px", flexShrink: 0 }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#3182F6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                  <i className="ti ti-calendar" />
                </span>
                <div>
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 1 }}>선택한 기간</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>{delegationValue}{unitLabel}</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#ccc", marginTop: 10 }}>이 기간이 지나면 위임이 만료되어, Agent가 더 이상 자율적으로 실행할 수 없습니다.</div>
            {!isDelegationValid && (
              <div style={{ fontSize: 11, color: "#E02020", marginTop: 6 }}>위임 기간은 1 이상의 정수로 입력해주세요. (0은 입력할 수 없습니다)</div>
            )}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingBottom: 10 }}>
        <button
          onClick={goBack}
          style={{ padding: "13px 28px", border: "1.5px solid #F0F0F0", borderRadius: 12, background: "#fff", fontSize: 14, fontWeight: 700, color: "#888", cursor: "pointer" }}
        >
          {step === 0 ? "취소" : "이전"}
        </button>
        {(() => {
          const isTerminal = step === lastStep;
          const isSkip = !isTerminal && step > 0 && !hasStepInput();
          const disabled =
            (step === 0 && !isNameValid) ||
            (step === 2 && !isBudgetValid) ||
            (isTerminal && !isDelegationValid) ||
            (isTerminal && saving);
          const label = isTerminal ? (saving ? "MetaMask 서명 대기 중..." : submitLabel) : isSkip ? "건너뛰기" : "다음";
          return (
            <button
              onClick={goNext}
              disabled={disabled}
              style={{
                padding: "13px 32px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: disabled ? "not-allowed" : "pointer",
                ...(disabled
                  ? { border: "none", background: "#CBD8EE", color: "#fff" }
                  : isSkip
                  ? { border: "1.5px solid #F0F0F0", background: "#fff", color: "#888" }
                  : { border: "none", background: "#3182F6", color: "#fff" }),
              }}
            >
              {label}
            </button>
          );
        })()}
      </div>
    </div>
  );
}
