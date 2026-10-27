"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Mark, cx } from "@/components/ui";
import { domainOf, emailOnDomain, regOk } from "@/lib/business-data";
import { useBusiness, type PayMethod } from "./business-store";

type FieldDef = { key: string; label: string; value: string; set: (v: string) => void; type?: string; ph?: string; ac?: string; help?: string; bad?: string | false };

function AuthField({ f, showErr }: { f: FieldDef; showErr: boolean }) {
  const bad = showErr && f.bad;
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      {f.label}
      <input
        value={f.value}
        onChange={(e) => f.set(e.target.value)}
        type={f.type ?? "text"}
        placeholder={f.ph}
        autoComplete={f.ac ?? "off"}
        aria-invalid={bad ? true : undefined}
        className={cx("h-[46px] rounded-[10px] border bg-card px-3.5 text-[15px] font-normal text-ink", bad ? "border-err" : "border-line")}
      />
      {(bad || f.help) && <span className={cx("text-xs font-normal", bad ? "text-err" : "text-muted")}>{bad || f.help}</span>}
    </label>
  );
}

/** Sign in, or the three-step business sign-up: business, login, payment. */
export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const b = useBusiness();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState("");
  const [login, setLogin] = useState({ email: "", pw: "" });
  const [biz, setBiz] = useState({ name: "", site: "", email: "", reg: "", pw: "" });
  const [pay, setPay] = useState<PayMethod>("card");

  const domain = domainOf(biz.site);
  const setB = (k: keyof typeof biz) => (v: string) => {
    setBiz((cur) => ({ ...cur, [k]: v }));
    setErr("");
  };

  let title = "";
  let sub = "";
  let cta = "";
  let fields: FieldDef[] = [];
  if (mode === "signin") {
    title = "Sign in";
    sub = "Use the work email your team invited you with.";
    cta = "Sign in";
    fields = [
      { key: "email", label: "Work email", value: login.email, set: (v) => (setLogin((l) => ({ ...l, email: v })), setErr("")), type: "email", ph: "name@company.com", ac: "email" },
      { key: "pw", label: "Password", value: login.pw, set: (v) => (setLogin((l) => ({ ...l, pw: v })), setErr("")), type: "password", ac: "current-password" },
    ];
  } else if (step === 1) {
    title = "Create a business account";
    sub = "Members see your business name on every Quest.";
    cta = "Continue";
    fields = [
      { key: "name", label: "Business name", value: biz.name, set: setB("name"), ph: "Paystack", bad: biz.name.trim().length < 2 && "Enter the registered business name." },
      { key: "site", label: "Website", value: biz.site, set: setB("site"), ph: "paystack.com", bad: !domain.includes(".") && "Enter your company website." },
      { key: "reg", label: "CAC registration number", value: biz.reg, set: setB("reg"), ph: "RC 1312946", help: "RC for companies, BN for business names.", bad: !regOk(biz.reg) && "Use the format RC 1234567 or BN 1234567." },
    ];
  } else if (step === 2) {
    title = "Your login";
    sub = "You'll be the account Admin. You can invite your team after.";
    cta = "Continue";
    fields = [
      { key: "email", label: "Work email", value: biz.email, set: setB("email"), type: "email", ac: "email", ph: "you@" + (domain || "company.com"), help: "Has to end in @" + (domain || "your website domain") + ".", bad: !emailOnDomain(biz.email, domain) && "Use an email ending in @" + domain + "." },
      { key: "pw", label: "Password", value: biz.pw, set: setB("pw"), type: "password", ac: "new-password", help: "At least 10 characters.", bad: biz.pw.length < 10 && "At least 10 characters." },
    ];
  } else {
    title = "How you'll pay";
    sub = "Budgets are held when a Quest launches. You're charged only for verified completions plus the 15% fee.";
    cta = "Create account";
  }

  const next = () => {
    if (mode === "signin") {
      if (!/@/.test(login.email) || !login.pw) return setErr("Enter your work email and password.");
      b.set({ verified: true });
      return router.push("/business/quests");
    }
    if (step < 3) {
      if (fields.some((f) => f.bad)) return setErr("Fix the highlighted fields.");
      setErr("");
      return setStep(step + 1);
    }
    b.startFresh({ name: biz.name.trim(), site: domain, email: biz.email.trim().toLowerCase(), reg: biz.reg.trim().toUpperCase() }, pay);
    router.push("/business/quests");
  };

  const back = () => {
    if (mode === "signup" && step > 1) {
      setErr("");
      setStep(step - 1);
    } else router.push("/business");
  };

  const methods: [PayMethod, string, string][] = [
    ["card", "Card", "Charged in naira through Paystack. You can add the card after signing up."],
    ["transfer", "Prepay by bank transfer", "We email an invoice and credit your balance when it lands, usually the same day. Minimum ₦800,000."],
  ];

  return (
    <div className="flex min-h-screen items-start justify-center bg-ground px-4 py-[clamp(24px,6vw,72px)] text-ink">
      <form
        className="flex w-full max-w-[460px] flex-col gap-[18px]"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={back} aria-label="Back" className="tap -ml-3 flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-ink">
            <ArrowLeft size={19} />
          </button>
          <Mark size={28} />
          <span className="text-[15px] font-bold">Heurekka for business</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-[-0.025em]">{title}</h1>
          <span className="text-sm leading-normal text-muted">{sub}</span>
        </div>
        {mode === "signup" && (
          <>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((n) => (
                <span key={n} className={cx("h-1 flex-1 rounded-full", n <= step ? "bg-orange" : "bg-raised")} />
              ))}
            </div>
            <span className="mono text-xs text-muted">Step {step} of 3</span>
          </>
        )}
        {fields.map((f) => (
          <AuthField key={mode + step + f.key} f={f} showErr={!!err} />
        ))}
        {mode === "signup" && step === 3 && (
          <div role="radiogroup" className="flex flex-col gap-2">
            {methods.map(([id, label, help]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={pay === id}
                onClick={() => setPay(id)}
                className={cx("tap flex min-h-[60px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left", pay === id ? "border-orange bg-warm" : "border-line hover:border-muted")}
              >
                <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", pay === id ? "border-orange" : "border-line")}>
                  {pay === id && <span className="h-2.5 w-2.5 rounded-full bg-orange" />}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs leading-snug text-muted">{help}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        {err && (
          <span role="alert" className="text-[13px] text-err">
            {err}
          </span>
        )}
        <Button type="submit" kind="primary" size="lg">
          {cta}
        </Button>
        <Link href={mode === "signin" ? "/business/sign-up" : "/business/sign-in"} className="tap flex min-h-11 items-center self-center text-sm text-lift">
          {mode === "signin" ? "New to Heurekka for business? Create an account" : "Already have an account? Sign in"}
        </Link>
      </form>
    </div>
  );
}
