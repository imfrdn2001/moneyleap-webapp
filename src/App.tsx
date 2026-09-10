import { useEffect, useState } from "react";
import {
  apiFetch,
  initializeMockSession,
  logoutMockSession,
  type AuthUser,
} from "./api";
import { GameModal } from "./GameModal";
import { type GameTier, MoleMark } from "./game-ui";
import { ProfilePage } from "./ProfilePage";

const payoutMultiplier = 2;
const previewHoles = Array.from({ length: 9 }, (_, index) => index);
const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const isGameTier = (value: unknown): value is GameTier => {
  if (typeof value !== "object" || value === null) return false;
  const tier = value as Record<string, unknown>;
  return (
    typeof tier.entryAmount === "number" &&
    typeof tier.moleCount === "number" &&
    Number.isInteger(tier.entryAmount) &&
    Number.isInteger(tier.moleCount) &&
    tier.entryAmount > 0 &&
    tier.moleCount > 0
  );
};

function GamePreview() {
  const [activeHole, setActiveHole] = useState(4);
  useEffect(() => {
    const interval = window.setInterval(
      () =>
        setActiveHole(
          (currentHole) =>
            (currentHole + Math.floor(Math.random() * 8) + 1) %
            previewHoles.length,
        ),
      2800,
    );
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="game-preview" aria-label="Whack-a-Mole game preview">
      <div className="preview-top">
        <span>Live match</span>
        <b>00:08.42</b>
      </div>
      <div className="mole-grid">
        {previewHoles.map((hole) => (
          <div
            className={`hole ${hole === activeHole ? "active" : ""}`}
            key={hole}
          >
            {hole === activeHole && (
              <span className="mole-pop">
                <MoleMark />
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="preview-bottom">
        <span>
          Moles <b>08 / 10</b>
        </span>
        <span>
          You’re fast <b>+120</b>
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [tiers, setTiers] = useState<GameTier[]>([]);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTiers() {
      try {
        const response = await fetch("/api/game-tiers", {
          signal: controller.signal,
        });
        const data: unknown = response.ok ? await response.json() : null;
        if (Array.isArray(data) && data.every(isGameTier)) setTiers(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setTiers([]);
      }
    }
    void loadTiers();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    async function startSession() {
      try {
        const user = await initializeMockSession();
        setAuthUser(user);

        const referralCode = new URLSearchParams(window.location.search).get(
          "ref",
        );
        if (referralCode) {
          await apiFetch("/api/referrals/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referralCode }),
          });
        }
      } catch {
        setAuthError("Unable to start the mock development session.");
      }
    }

    void startSession();
  }, []);

  async function handleLogout() {
    await logoutMockSession();
    setIsProfileOpen(false);
    setIsGameOpen(false);
    setAuthUser(null);
  }

  if (isProfileOpen && authUser) {
    return (
      <ProfilePage
        user={authUser}
        onBack={() => setIsProfileOpen(false)}
        onLogout={() => void handleLogout()}
      />
    );
  }

  return (
    <main>
      <nav className="nav container" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="MoneyLeap home">
          <span className="brand-mark">M</span>Money<span>Leap</span>
        </a>
        <a className="nav-link" href="#games">
          Games
        </a>
        <button
          className="login-button"
          type="button"
          disabled={!authUser}
          onClick={() => setIsProfileOpen(true)}
        >
          {authUser ? `${authUser.displayName} · Mock` : "Starting…"}
        </button>
      </nav>
      <section className="hero container" id="top">
        <div className="hero-copy">
          <p className="kicker">
            <span />
            Skill-based games. Real rewards.
          </p>
          <h1>
            Whack faster.
            <br />
            <em>Win bigger.</em>
          </h1>
          <p className="hero-text">
            Whack all the moles first to win 2× your entry.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              disabled={!authUser}
              onClick={() => setIsGameOpen(true)}
            >
              Play Whack-a-Mole <span>→</span>
            </button>
            <a className="how-link" href="#how-it-works">
              How it works <span>↓</span>
            </a>
          </div>
          <div className="trust-row" aria-label="Game attributes">
            <span>✦ Skill-first</span>
            <span>◈ Head-to-head</span>
            <span>● Instant results</span>
          </div>
        </div>
        <GamePreview />
      </section>
      <section className="referral container">
        <div className="referral-copy">
          <p className="kicker">
            <span />
            Share the fun
          </p>
          <h2>
            Bring a friend.
            <br />
            <em>Earn ₹50.</em>
          </h2>
          <p>
            Invite friends to MoneyLeap and earn ₹50 for every successful
            referral.
          </p>
          <button
            className="secondary-button"
            type="button"
            disabled={!authUser}
            onClick={() => setIsProfileOpen(true)}
          >
            Refer & earn <span>→</span>
          </button>
          {authError && (
            <p className="auth-error" role="alert">
              {authError}
            </p>
          )}
        </div>
        <div className="referral-visual">
          <div className="coin coin-one">₹</div>
          <div className="coin coin-two">₹</div>
          <div className="referral-card">
            <span>Your reward</span>
            <strong>₹50</strong>
            <small>per referral</small>
          </div>
        </div>
      </section>
      <section className="game-section container" id="games">
        <div className="section-heading">
          <div>
            <p className="kicker">
              <span />
              Featured game
            </p>
            <h2>Choose your challenge</h2>
          </div>
          <p>Pick an entry, beat the clock, and outplay your match.</p>
        </div>
        <article className="featured-game">
          <div className="featured-icon">
            <MoleMark />
          </div>
          <div className="featured-details">
            <p>01 — MoneyLeap original</p>
            <h3>Whack-a-Mole</h3>
            <span>The fastest to clear the board wins.</span>
            <strong className="payout-badge">Win 2× your entry</strong>
          </div>
          <div
            className="tier-list"
            aria-live="polite"
            aria-label="Whack-a-Mole entry tiers"
          >
            {tiers.length ? (
              tiers.map((tier) => (
                <div className="tier" key={tier.entryAmount}>
                  <span className="tier-label">Entry</span>
                  <b>{formatRupees(tier.entryAmount)}</b>
                  <small>
                    Win {formatRupees(tier.entryAmount * payoutMultiplier)}
                  </small>
                  <span>{tier.moleCount} moles</span>
                </div>
              ))
            ) : (
              <span className="tier-status">Loading game tiers…</span>
            )}
          </div>
          <a className="play-circle" href="#top" aria-label="Play Whack-a-Mole">
            →
          </a>
        </article>
        <div className="coming-soon-grid">
          <article className="coming-card reaction">
            <div className="coming-art">⚡</div>
            <p>Coming soon</p>
            <h3>Reaction Rush</h3>
            <span>Trust your reflexes.</span>
          </article>
          <article className="coming-card carrom">
            <div className="coming-art">◎</div>
            <p>Coming soon</p>
            <h3>Carrom Clash</h3>
            <span>A classic, reimagined.</span>
          </article>
        </div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="container how-content">
          <div>
            <p className="kicker">
              <span />
              Simple by design
            </p>
            <h2>
              One game.
              <br />
              One winner.
            </h2>
          </div>
          <div className="steps">
            <p>
              <b>01</b> Choose your entry
            </p>
            <p>
              <b>02</b> Get matched
            </p>
            <p>
              <b>03</b> Clear the moles first
            </p>
          </div>
        </div>
      </section>
      <footer className="footer container">
        <a className="brand" href="#top">
          <span className="brand-mark">M</span>Money<span>Leap</span>
        </a>
        <p>Play with skill. Leap with confidence.</p>
        <span>© 2026 MoneyLeap</span>
      </footer>
      <GameModal
        open={isGameOpen}
        tiers={tiers}
        onClose={() => setIsGameOpen(false)}
      />
    </main>
  );
}
