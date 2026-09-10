import { useEffect, useState } from "react";
import { apiFetch, type AuthUser } from "./api";

type ReferralDashboard = {
  referralCode: string;
  sharePath: string;
  walletBalance: number;
  successfulReferrals: number;
  history: {
    displayName: string;
    status: string;
    rewardAmount: number | null;
  }[];
};

const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export function ProfilePage({
  user,
  onBack,
  onLogout,
}: {
  user: AuthUser;
  onBack: () => void;
  onLogout: () => void;
}) {
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      try {
        const response = await apiFetch("/api/referrals/me", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        setDashboard((await response.json()) as ReferralDashboard);
      } catch {
        if (!controller.signal.aborted)
          setError("Unable to load referral details.");
      }
    }
    void loadProfile();
    return () => controller.abort();
  }, []);

  async function copyLink() {
    if (!dashboard) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${dashboard.sharePath}`,
      );
      setCopied(true);
    } catch {
      setError(
        "Copying is unavailable in this browser. Copy the code instead.",
      );
    }
  }

  return (
    <main className="profile-page">
      <nav className="nav container" aria-label="Profile navigation">
        <button className="brand profile-back" type="button" onClick={onBack}>
          <span className="brand-mark">M</span>Money<span>Leap</span>
        </button>
        <button className="login-button" type="button" onClick={onBack}>
          ← Home
        </button>
      </nav>
      <section className="profile container">
        <p className="kicker">
          <span /> Your profile
        </p>
        <div className="profile-heading">
          <div className="profile-avatar">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1>{user.displayName}</h1>
            <p>Mock account · resets when the backend restarts.</p>
          </div>
        </div>
        <section className="profile-wallet">
          <span>Mock wallet balance</span>
          <strong>{formatRupees(dashboard?.walletBalance ?? 0)}</strong>
          <small>Payments and withdrawals are not integrated yet.</small>
        </section>
        <section
          className="profile-referrals"
          aria-labelledby="referral-heading"
        >
          <div className="profile-section-heading">
            <div>
              <p className="kicker">
                <span /> Refer & earn
              </p>
              <h2 id="referral-heading">Invite friends. Earn ₹50.</h2>
            </div>
            <p>Earn after your friend completes their first paid match.</p>
          </div>
          {error && (
            <p className="modal-error" role="alert">
              {error}
            </p>
          )}
          {!dashboard && !error && (
            <p className="modal-copy">Loading your referral details…</p>
          )}
          {dashboard && (
            <div className="profile-referral-grid">
              <div className="referral-code-box">
                <span>Your permanent referral code</span>
                <strong>{dashboard.referralCode}</strong>
                <button
                  className="primary-button referral-copy"
                  type="button"
                  onClick={() => void copyLink()}
                >
                  {copied ? "Link copied" : "Copy referral link"} <span>→</span>
                </button>
              </div>
              <div className="referral-stats">
                <div>
                  <span>Successful referrals</span>
                  <b>{dashboard.successfulReferrals}</b>
                </div>
                <div>
                  <span>Mock rewards earned</span>
                  <b>{formatRupees(dashboard.walletBalance)}</b>
                </div>
              </div>
            </div>
          )}
          <h3 className="referral-history-title">Referral history</h3>
          {dashboard &&
            (dashboard.history.length ? (
              <div className="referral-history">
                {dashboard.history.map((item, index) => (
                  <div key={`${item.displayName}-${index}`}>
                    <span>{item.displayName}</span>
                    <small>{item.status}</small>
                    {item.rewardAmount && (
                      <b>{formatRupees(item.rewardAmount)}</b>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="modal-copy">
                No referrals yet. Share your code to get started.
              </p>
            ))}
        </section>
        <button className="profile-logout" type="button" onClick={onLogout}>
          Log out of mock session
        </button>
      </section>
    </main>
  );
}
