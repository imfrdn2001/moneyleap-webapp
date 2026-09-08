import { useEffect, useState } from 'react';

type GameTier = { entryAmount: number; moleCount: number };

const payoutMultiplier = 2;
const previewHoles = Array.from({ length: 9 }, (_, index) => index);
const formatRupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const isGameTier = (value: unknown): value is GameTier => {
  if (typeof value !== 'object' || value === null) return false;
  const tier = value as Record<string, unknown>;
  return typeof tier.entryAmount === 'number' && typeof tier.moleCount === 'number' && Number.isInteger(tier.entryAmount) && Number.isInteger(tier.moleCount) && tier.entryAmount > 0 && tier.moleCount > 0;
};

function MoleMark() {
  return <svg aria-hidden="true" className="mole-mark" viewBox="0 0 80 80" fill="none"><path d="M17 36 10 20c-2-5 4-8 8-4l11 11M63 36l7-16c2-5-4-8-8-4L51 27" fill="#B86F42" stroke="#4A2519" strokeWidth="3" strokeLinejoin="round"/><path d="M16 78V48c0-19 10-31 24-31s24 12 24 31v30H16Z" fill="#C77B49" stroke="#4A2519" strokeWidth="3"/><path d="M20 47c4-15 12-23 20-23s16 8 20 23" stroke="#E5A46C" strokeWidth="4" strokeLinecap="round"/><ellipse cx="40" cy="52" rx="17" ry="14" fill="#EBC08A"/><ellipse cx="28" cy="47" rx="5" ry="6" fill="#1A1A25"/><ellipse cx="52" cy="47" rx="5" ry="6" fill="#1A1A25"/><circle cx="29.5" cy="45.5" r="1.5" fill="#fff"/><circle cx="53.5" cy="45.5" r="1.5" fill="#fff"/><path d="M32 39c-3-3-6-3-8-1M48 39c3-3 6-3 8-1" stroke="#4A2519" strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="40" cy="54" rx="5" ry="3.5" fill="#4A2519"/><path d="M36 60c2 3 6 3 8 0" stroke="#4A2519" strokeWidth="2.5" strokeLinecap="round"/><path d="M17 67c4-3 8-3 11 1M63 67c-4-3-8-3-11 1" stroke="#EBC08A" strokeWidth="5" strokeLinecap="round"/><path d="M35 63h3l2 3 2-3h3" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/></svg>;
}

function GamePreview() {
  const [activeHole, setActiveHole] = useState(4);
  useEffect(() => {
    const interval = window.setInterval(() => setActiveHole((currentHole) => (currentHole + Math.floor(Math.random() * 8) + 1) % previewHoles.length), 2800);
    return () => window.clearInterval(interval);
  }, []);

  return <div className="game-preview" aria-label="Whack-a-Mole game preview"><div className="preview-top"><span>Live match</span><b>00:08.42</b></div><div className="mole-grid">{previewHoles.map((hole) => <div className={`hole ${hole === activeHole ? 'active' : ''}`} key={hole}>{hole === activeHole && <span className="mole-pop"><MoleMark/></span>}</div>)}</div><div className="preview-bottom"><span>Moles <b>08 / 10</b></span><span>You’re fast <b>+120</b></span></div></div>;
}

export default function App() {
  const [tiers, setTiers] = useState<GameTier[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    async function loadTiers() {
      try {
        const response = await fetch('/api/game-tiers', { signal: controller.signal });
        const data: unknown = response.ok ? await response.json() : null;
        if (Array.isArray(data) && data.every(isGameTier)) setTiers(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setTiers([]);
      }
    }
    void loadTiers();
    return () => controller.abort();
  }, []);

  return <main>
    <nav className="nav container" aria-label="Main navigation"><a className="brand" href="#top" aria-label="MoneyLeap home"><span className="brand-mark">M</span>Money<span>Leap</span></a><a className="nav-link" href="#games">Games</a><button className="login-button" type="button">Log in</button></nav>
    <section className="hero container" id="top"><div className="hero-copy"><p className="kicker"><span/>Skill-based games. Real rewards.</p><h1>Whack faster.<br/><em>Win bigger.</em></h1><p className="hero-text">Whack all the moles first to win 2× your entry.</p><div className="hero-actions"><a className="primary-button" href="#games">Play Whack-a-Mole <span>→</span></a><a className="how-link" href="#how-it-works">How it works <span>↓</span></a></div><div className="trust-row" aria-label="Game attributes"><span>✦ Skill-first</span><span>◈ Head-to-head</span><span>● Instant results</span></div></div><GamePreview/></section>
    <section className="referral container"><div className="referral-copy"><p className="kicker"><span/>Share the fun</p><h2>Bring a friend.<br/><em>Earn ₹50.</em></h2><p>Invite friends to MoneyLeap and earn ₹50 for every successful referral.</p><button className="secondary-button" type="button">Refer & earn <span>→</span></button></div><div className="referral-visual"><div className="coin coin-one">₹</div><div className="coin coin-two">₹</div><div className="referral-card"><span>Your reward</span><strong>₹50</strong><small>per referral</small></div></div></section>
    <section className="game-section container" id="games"><div className="section-heading"><div><p className="kicker"><span/>Featured game</p><h2>Choose your challenge</h2></div><p>Pick an entry, beat the clock, and outplay your match.</p></div><article className="featured-game"><div className="featured-icon"><MoleMark/></div><div className="featured-details"><p>01 — MoneyLeap original</p><h3>Whack-a-Mole</h3><span>The fastest to clear the board wins.</span><strong className="payout-badge">Win 2× your entry</strong></div><div className="tier-list" aria-live="polite" aria-label="Whack-a-Mole entry tiers">{tiers.length ? tiers.map((tier) => <div className="tier" key={tier.entryAmount}><span className="tier-label">Entry</span><b>{formatRupees(tier.entryAmount)}</b><small>Win {formatRupees(tier.entryAmount * payoutMultiplier)}</small><span>{tier.moleCount} moles</span></div>) : <span className="tier-status">Loading game tiers…</span>}</div><a className="play-circle" href="#top" aria-label="Play Whack-a-Mole">→</a></article><div className="coming-soon-grid"><article className="coming-card reaction"><div className="coming-art">⚡</div><p>Coming soon</p><h3>Reaction Rush</h3><span>Trust your reflexes.</span></article><article className="coming-card carrom"><div className="coming-art">◎</div><p>Coming soon</p><h3>Carrom Clash</h3><span>A classic, reimagined.</span></article></div></section>
    <section className="how-section" id="how-it-works"><div className="container how-content"><div><p className="kicker"><span/>Simple by design</p><h2>One game.<br/>One winner.</h2></div><div className="steps"><p><b>01</b> Choose your entry</p><p><b>02</b> Get matched</p><p><b>03</b> Clear the moles first</p></div></div></section>
    <footer className="footer container"><a className="brand" href="#top"><span className="brand-mark">M</span>Money<span>Leap</span></a><p>Play with skill. Leap with confidence.</p><span>© 2026 MoneyLeap</span></footer>
  </main>;
}
