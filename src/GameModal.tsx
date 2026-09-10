import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "./api";
import { type GameTier, MoleMark } from "./game-ui";

type Match = {
  matchId: string;
  userName: string;
  moleCount: number;
  entryAmount: number | null;
  isPractice: boolean;
};
type Result = {
  playerTimeMilliseconds: number;
  opponentTimeMilliseconds: number;
  playerWon: boolean;
  payoutAmount: number | null;
};
type Screen = "select" | "matchup" | "playing" | "result";
type Countdown = 3 | 2 | 1 | "START";

const holes = Array.from({ length: 9 }, (_, index) => index);
const confettiPieces = Array.from({ length: 30 }, (_, index) => index);
const confettiColors = ["#00e68a", "#00d2e6", "#eaff71", "#ffca6a", "#f48fb1"];
const formatTime = (milliseconds: number) =>
  `${(milliseconds / 1000).toFixed(2)}s`;
const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

function useGameSounds() {
  const contextRef = useRef<AudioContext | null>(null);
  return useCallback(
    (
      frequency: number,
      duration = 0.08,
      type: OscillatorType = "sine",
      volume = 0.06,
    ) => {
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      void context.resume();

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration,
      );
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    },
    [],
  );
}

export function GameModal({
  open,
  tiers,
  onClose,
}: {
  open: boolean;
  tiers: GameTier[];
  onClose: () => void;
}) {
  const [screen, setScreen] = useState<Screen>("select");
  const [match, setMatch] = useState<Match | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [hits, setHits] = useState(0);
  const [activeHole, setActiveHole] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<GameTier | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<Countdown>(3);
  const playSound = useGameSounds();
  const isAwaitingNextMole = useRef(false);
  const nextMoleTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setScreen("select");
      setMatch(null);
      setResult(null);
      setHits(0);
      setSelectedTier(null);
      setErrorMessage(null);
      setCountdown(3);
      isAwaitingNextMole.current = false;
      if (nextMoleTimer.current !== null) {
        window.clearTimeout(nextMoleTimer.current);
        nextMoleTimer.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (screen !== "matchup") return;

    setCountdown(3);
    playSound(420, 0.08, "triangle");
    const showTwo = window.setTimeout(() => {
      setCountdown(2);
      playSound(520, 0.08, "triangle");
    }, 850);
    const showOne = window.setTimeout(() => {
      setCountdown(1);
      playSound(640, 0.08, "triangle");
    }, 1700);
    const showStart = window.setTimeout(() => {
      setCountdown("START");
      playSound(820, 0.16, "sine");
    }, 2550);
    const startGame = window.setTimeout(() => {
      setScreen("playing");
    }, 3150);

    return () => {
      window.clearTimeout(showTwo);
      window.clearTimeout(showOne);
      window.clearTimeout(showStart);
      window.clearTimeout(startGame);
    };
  }, [playSound, screen]);

  async function startMatch(isPractice: boolean, entryAmount?: number) {
    setErrorMessage(null);
    setIsLoading(true);
    setSelectedTier(null);
    isAwaitingNextMole.current = false;
    playSound(360, 0.08, "triangle");
    try {
      const response = await apiFetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPractice, entryAmount: entryAmount ?? null }),
      });
      if (!response.ok) throw new Error("Unable to create match.");
      const nextMatch = (await response.json()) as Match;
      setMatch(nextMatch);
      setHits(0);
      setActiveHole(Math.floor(Math.random() * holes.length));
      setScreen("matchup");
    } catch {
      setErrorMessage("Unable to start the match. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function whack(hole: number) {
    if (
      !match ||
      hole !== activeHole ||
      isLoading ||
      isAwaitingNextMole.current
    )
      return;

    isAwaitingNextMole.current = true;
    const nextHits = hits + 1;
    setHits(nextHits);
    playSound(680, 0.06, "square");
    if (nextHits < match.moleCount) {
      nextMoleTimer.current = window.setTimeout(() => {
        setActiveHole(
          (hole + Math.floor(Math.random() * 8) + 1) % holes.length,
        );
        isAwaitingNextMole.current = false;
        nextMoleTimer.current = null;
      }, 110);
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await apiFetch(
        `/api/matches/${match.matchId}/complete`,
        {
          method: "POST",
        },
      );
      if (!response.ok) throw new Error("Unable to complete match.");
      const matchResult = (await response.json()) as Result;
      setResult(matchResult);
      setScreen("result");
      if (matchResult.playerWon && !match.isPractice) {
        [523, 659, 784, 1047].forEach((frequency, index) => {
          window.setTimeout(
            () => playSound(frequency, 0.18, "triangle", 0.12),
            index * 135,
          );
        });
      } else {
        playSound(220, 0.22, "sine");
      }
    } catch {
      setErrorMessage("Unable to finish the match. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) return null;
  return (
    <div className="game-modal-backdrop" role="presentation">
      <section
        className="game-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Whack-a-Mole match"
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close game"
        >
          ×
        </button>
        {errorMessage && (
          <p className="modal-error" role="alert">
            {errorMessage}
          </p>
        )}
        {screen === "select" && (
          <>
            <p className="kicker">
              <span />
              Whack-a-Mole.
            </p>
            <h2>Play Whack-a-Mole</h2>
            <p className="modal-copy">
              Practice is a solo match. Paid matches use a clearly labelled Test
              Opponent while payments are being integrated.
            </p>
            <button
              className="practice-card"
              type="button"
              disabled={isLoading}
              onClick={() => void startMatch(true)}
            >
              <span>
                <b>Practice match</b>
                <small>15 moles · Free entry</small>
              </span>
              <strong>Play →</strong>
            </button>
            <div className="modal-divider">
              <span>Or choose an entry</span>
            </div>
            <div className="modal-tiers">
              {tiers.map((tier) => (
                <button
                  className={
                    selectedTier?.entryAmount === tier.entryAmount
                      ? "selected"
                      : ""
                  }
                  key={tier.entryAmount}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedTier(tier);
                    playSound(520, 0.05, "triangle");
                  }}
                >
                  <span>{formatRupees(tier.entryAmount)}</span>
                  <small>
                    {tier.moleCount} moles · Win{" "}
                    {formatRupees(tier.entryAmount * 2)}
                  </small>
                </button>
              ))}
            </div>
            {selectedTier && (
              <button
                className="primary-button denomination-play"
                type="button"
                disabled={isLoading}
                onClick={() => void startMatch(false, selectedTier.entryAmount)}
              >
                Play for {formatRupees(selectedTier.entryAmount)} <span>→</span>
              </button>
            )}
          </>
        )}
        {screen === "matchup" && match && (
          <div className="matchup" aria-live="polite">
            <p className="kicker">
              <span />
              {match.isPractice ? "Practice match" : "Match found"}
            </p>
            <h2>Get ready</h2>
            <p className="modal-copy">
              First to clear {match.moleCount} moles wins.
            </p>
            {match.isPractice ? (
              <div className="matchup-card solo-matchup">
                <div className="matchup-player">
                  <span className="matchup-avatar player">P</span>
                  <b>{match.userName}</b>
                  <small>Solo practice · {match.moleCount} moles</small>
                </div>
              </div>
            ) : (
              <div className="matchup-card">
                <div className="matchup-player opponent">
                  <span className="matchup-avatar">T</span>
                  <b>Test Opponent</b>
                  <small>Simulation</small>
                </div>
                <strong className="matchup-versus">VS</strong>
                <div className="matchup-player">
                  <span className="matchup-avatar player">P</span>
                  <b>{match.userName}</b>
                  <small>You</small>
                </div>
              </div>
            )}
            <p className="matchup-status">
              <span className="countdown-label">Match starts in</span>
              <strong
                className="countdown-value"
                key={countdown}
                aria-live="assertive"
              >
                {countdown}
              </strong>
            </p>
          </div>
        )}
        {screen === "playing" && match && (
          <>
            <div className="match-header">
              {match.isPractice ? (
                <span>Solo practice · {match.userName}</span>
              ) : (
                <>
                  <span>Test Opponent</span>
                  <b>vs</b>
                  <span>{match.userName}</span>
                </>
              )}
            </div>
            <div className="match-progress">
              <span>
                {hits} / {match.moleCount} moles
              </span>
              <span>
                {match.isPractice
                  ? "Practice match"
                  : formatRupees(match.entryAmount!)}
              </span>
            </div>
            <div className="play-grid">
              {holes.map((hole) => (
                <button
                  className={`play-hole ${hole === activeHole ? "active" : ""}`}
                  key={hole}
                  type="button"
                  onClick={() => void whack(hole)}
                  aria-label={hole === activeHole ? "Whack mole" : "Empty hole"}
                >
                  {hole === activeHole && <MoleMark />}
                </button>
              ))}
            </div>
            <p className="game-hint">Whack every mole as fast as you can.</p>
          </>
        )}
        {screen === "result" && result && (
          <>
            {!match?.isPractice && result.playerWon && (
              <div className="confetti" aria-hidden="true">
                {confettiPieces.map((piece) => (
                  <span
                    key={piece}
                    style={{
                      left: `${(piece * 37) % 100}%`,
                      backgroundColor:
                        confettiColors[piece % confettiColors.length],
                      animationDelay: `${(piece % 10) * 55}ms`,
                    }}
                  />
                ))}
              </div>
            )}
            <p className="kicker">
              <span />
              Match complete
            </p>
            <h2>
              {match?.isPractice
                ? "Practice complete!"
                : result.playerWon
                  ? "You win!"
                  : "Test Opponent wins"}
            </h2>
            <div className={`time-results ${match?.isPractice ? "solo" : ""}`}>
              <div>
                <span>{match?.userName}</span>
                <b>{formatTime(result.playerTimeMilliseconds)}</b>
              </div>
              {!match?.isPractice && (
                <div>
                  <span>Test Opponent</span>
                  <b>{formatTime(result.opponentTimeMilliseconds)}</b>
                </div>
              )}
            </div>
            {match?.isPractice ? (
              <p className="practice-result-message">
                Nice work! You could have won a real match.
              </p>
            ) : result.payoutAmount ? (
              <>
                <p className="result-payout">
                  You won {formatRupees(result.payoutAmount)}
                </p>
                <p className="result-message">
                  Amazing work — you beat the Test Opponent!
                </p>
              </>
            ) : (
              <p className="result-message">
                You can win next time — give it another shot!
              </p>
            )}
            <button
              className="primary-button replay-button"
              type="button"
              onClick={() => setScreen("select")}
            >
              Play again <span>→</span>
            </button>
            <div className="modal-divider">
              <span>Choose a denomination</span>
            </div>
            <div className="modal-tiers">
              {tiers.map((tier) => (
                <button
                  className={
                    selectedTier?.entryAmount === tier.entryAmount
                      ? "selected"
                      : ""
                  }
                  key={tier.entryAmount}
                  type="button"
                  onClick={() => {
                    setSelectedTier(tier);
                    playSound(520, 0.05, "triangle");
                  }}
                >
                  <span>{formatRupees(tier.entryAmount)}</span>
                  <small>Win {formatRupees(tier.entryAmount * 2)}</small>
                </button>
              ))}
            </div>
            {selectedTier && (
              <button
                className="primary-button denomination-play"
                type="button"
                onClick={() => void startMatch(false, selectedTier.entryAmount)}
              >
                Play for {formatRupees(selectedTier.entryAmount)} <span>→</span>
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
