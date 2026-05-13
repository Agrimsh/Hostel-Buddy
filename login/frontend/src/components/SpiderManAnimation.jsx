import { useEffect, useState, useMemo } from "react";
import "./SpiderManAnimation.css";

/**
 * PixelSpiderMan — canvas-drawn pixel Spider-Man
 * Swings from top-right, lands below the heading, waves, greets the user.
 *
 * All motion is done via CSS transforms on a FIXED container (no layout shifts).
 * The landing zone reserves space so the page never jumps.
 */

const PX = 3; // 3px per pixel → 14×3=42, 18×3=54 canvas size, displayed at 60×78 via CSS scale

const C = {
  RED: "#e53935", DRED: "#c62828", LRED: "#ef5350",
  BLUE: "#1e88e5", DBLUE: "#1565c0", LBLUE: "#42a5f5",
  BLACK: "#212121", GREY: "#424242",
  EYE: "#e0e0e0", EYEBRIGHT: "#ffffff",
  WEB: "#9e9e9e", SKIN: "#ffccbc",
};

function px(ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x * PX, y * PX, PX, PX);
}

function row(ctx, y, sx, colors) {
  colors.forEach((c, i) => { if (c) px(ctx, sx + i, y, c); });
}

/* ── Detailed Spider-Man Sprites ── */

function drawSitting(ctx) {
  const { RED: R, DRED: D, LRED: L, BLUE: B, DBLUE: DB, LBLUE: LB,
          BLACK: K, EYE: E, EYEBRIGHT: EB } = C;
  // Head
  row(ctx, 0, 5, [R, R, R, R]);
  row(ctx, 1, 3, [R, R, R, R, R, R, R, R]);
  row(ctx, 2, 2, [R, R, R, R, R, R, R, R, R, R]);
  row(ctx, 3, 2, [R, K, K, R, R, R, R, K, K, R]);
  row(ctx, 4, 2, [R, K, E, EB, K, K, E, EB, K, R]);
  row(ctx, 5, 2, [R, K, EB, E, K, K, EB, E, K, R]);
  row(ctx, 6, 2, [R, R, K, K, R, R, K, K, R, R]);
  row(ctx, 7, 3, [D, R, R, R, R, R, R, D]);
  row(ctx, 8, 3, [D, D, R, R, R, R, D, D]);
  // Neck
  row(ctx, 9, 5, [R, R, R, R]);
  // Body
  row(ctx, 10, 4, [R, B, B, B, B, R]);
  row(ctx, 11, 3, [R, B, B, B, B, B, B, R]);
  row(ctx, 12, 3, [B, B, DB, B, B, DB, B, B]);
  row(ctx, 13, 3, [B, LB, DB, B, B, DB, LB, B]);
  row(ctx, 14, 3, [B, B, B, B, B, B, B, B]);
  row(ctx, 15, 4, [B, B, B, B, B, B]);
  // Arms at sides
  row(ctx, 11, 1, [R, R]);
  row(ctx, 12, 0, [R, R]);
  row(ctx, 13, 0, [D]);
  row(ctx, 11, 11, [R, R]);
  row(ctx, 12, 12, [R, R]);
  row(ctx, 13, 13, [D]);
  // Legs sitting
  row(ctx, 16, 3, [B, B, B, null, null, B, B, B]);
  row(ctx, 17, 2, [B, B, B, null, null, null, null, B, B, B]);
}

function drawWaving(ctx, frame) {
  const { RED: R, DRED: D, BLUE: B, DBLUE: DB, LBLUE: LB,
          BLACK: K, EYE: E, EYEBRIGHT: EB, SKIN: S } = C;
  // Head (same)
  row(ctx, 0, 5, [R, R, R, R]);
  row(ctx, 1, 3, [R, R, R, R, R, R, R, R]);
  row(ctx, 2, 2, [R, R, R, R, R, R, R, R, R, R]);
  row(ctx, 3, 2, [R, K, K, R, R, R, R, K, K, R]);
  row(ctx, 4, 2, [R, K, E, EB, K, K, E, EB, K, R]);
  row(ctx, 5, 2, [R, K, EB, E, K, K, EB, E, K, R]);
  row(ctx, 6, 2, [R, R, K, K, R, R, K, K, R, R]);
  row(ctx, 7, 3, [D, R, R, R, R, R, R, D]);
  row(ctx, 8, 3, [D, D, R, R, R, R, D, D]);
  row(ctx, 9, 5, [R, R, R, R]);
  // Body
  row(ctx, 10, 4, [R, B, B, B, B, R]);
  row(ctx, 11, 3, [R, B, B, B, B, B, B, R]);
  row(ctx, 12, 3, [B, B, DB, B, B, DB, B, B]);
  row(ctx, 13, 3, [B, LB, DB, B, B, DB, LB, B]);
  row(ctx, 14, 3, [B, B, B, B, B, B, B, B]);
  row(ctx, 15, 4, [B, B, B, B, B, B]);
  // Right arm at side
  row(ctx, 11, 11, [R, R]);
  row(ctx, 12, 12, [R, R]);
  row(ctx, 13, 13, [D]);
  // Left arm waving - two frames
  if (frame % 2 === 0) {
    row(ctx, 5, 0, [S, S]);
    row(ctx, 6, 0, [R]);
    row(ctx, 7, 0, [R, R]);
    row(ctx, 8, 1, [R]);
    row(ctx, 9, 1, [R, R]);
    row(ctx, 10, 2, [R, R]);
    row(ctx, 11, 2, [R]);
  } else {
    row(ctx, 4, 0, [S]);
    row(ctx, 5, 0, [S]);
    row(ctx, 6, 0, [R, R]);
    row(ctx, 7, 1, [R]);
    row(ctx, 8, 1, [R, R]);
    row(ctx, 9, 2, [R]);
    row(ctx, 10, 2, [R, R]);
    row(ctx, 11, 2, [R]);
  }
  // Legs
  row(ctx, 16, 3, [B, B, B, null, null, B, B, B]);
  row(ctx, 17, 2, [B, B, B, null, null, null, null, B, B, B]);
}

function drawSwinging(ctx) {
  const { RED: R, DRED: D, BLUE: B, DBLUE: DB, LBLUE: LB,
          BLACK: K, EYE: E, EYEBRIGHT: EB } = C;
  // Head
  row(ctx, 0, 5, [R, R, R, R]);
  row(ctx, 1, 3, [R, R, R, R, R, R, R, R]);
  row(ctx, 2, 2, [R, R, R, R, R, R, R, R, R, R]);
  row(ctx, 3, 2, [R, K, K, R, R, R, R, K, K, R]);
  row(ctx, 4, 2, [R, K, E, EB, K, K, E, EB, K, R]);
  row(ctx, 5, 2, [R, K, EB, E, K, K, EB, E, K, R]);
  row(ctx, 6, 2, [R, R, K, K, R, R, K, K, R, R]);
  row(ctx, 7, 3, [D, R, R, R, R, R, R, D]);
  row(ctx, 8, 3, [D, D, R, R, R, R, D, D]);
  row(ctx, 9, 5, [R, R, R, R]);
  // Body
  row(ctx, 10, 4, [R, B, B, B, B, R]);
  row(ctx, 11, 3, [R, B, B, B, B, B, B, R]);
  row(ctx, 12, 3, [B, B, DB, B, B, DB, B, B]);
  row(ctx, 13, 3, [B, B, B, B, B, B, B, B]);
  // Right arm up (web)
  row(ctx, 1, 11, [R]);
  row(ctx, 2, 11, [R, R]);
  row(ctx, 3, 12, [R]);
  row(ctx, 4, 12, [R]);
  row(ctx, 5, 12, [R]);
  row(ctx, 6, 11, [R, R]);
  row(ctx, 7, 11, [R]);
  row(ctx, 8, 11, [R]);
  row(ctx, 9, 10, [R]);
  row(ctx, 10, 10, [R]);
  // Left arm back
  row(ctx, 10, 2, [R]);
  row(ctx, 11, 1, [R, R]);
  row(ctx, 12, 0, [R, R]);
  // Legs spread
  row(ctx, 14, 2, [B, B, null, null, null, null, null, null, B, B]);
  row(ctx, 15, 1, [B, B, null, null, null, null, null, null, null, B, B]);
  row(ctx, 16, 1, [R, R, null, null, null, null, null, null, null, R, R]);
  row(ctx, 17, 0, [R, R]);
  row(ctx, 17, 11, [R, R]);
}

function makeSprite(fn, ...args) {
  const c = document.createElement("canvas");
  c.width = 14 * PX;
  c.height = 18 * PX;
  const ctx = c.getContext("2d");
  fn(ctx, ...args);
  return c.toDataURL();
}

// ── Component ──
const SpiderManAnimation = ({ userName = "User" }) => {
  const [phase, setPhase] = useState("swing");
  const [waveFrame, setWaveFrame] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState("");

  const sprites = useMemo(() => ({
    swing: makeSprite(drawSwinging),
    sit:   makeSprite(drawSitting),
    w0:    makeSprite(drawWaving, 0),
    w1:    makeSprite(drawWaving, 1),
  }), []);

  const src = useMemo(() => {
    if (phase === "swing") return sprites.swing;
    if (phase === "wave" || phase === "talk") return waveFrame % 2 === 0 ? sprites.w0 : sprites.w1;
    return sprites.sit;
  }, [phase, waveFrame, sprites]);

  // Timeline
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase("land"),  2200),
      setTimeout(() => setPhase("sit"),   2800),
      setTimeout(() => setPhase("wave"),  3400),
      setTimeout(() => { setPhase("talk"); setShowBubble(true); }, 5000),
      setTimeout(() => setPhase("idle"),  7000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  // Wave tick
  useEffect(() => {
    if (phase !== "wave" && phase !== "talk") return;
    const id = setInterval(() => setWaveFrame(f => f + 1), 300);
    return () => clearInterval(id);
  }, [phase]);

  // Typewriter
  useEffect(() => {
    if (!showBubble) return;
    const full = `Welcome, ${userName}! 🕷️`;
    let i = 0;
    setBubbleText("");
    const id = setInterval(() => {
      i++;
      setBubbleText(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [showBubble, userName]);

  return (
    <div className={`spidey-container spidey-p-${phase}`} aria-hidden="true">

      {/* Web line from anchor → spidey (visible during swing) */}
      {(phase === "swing" || phase === "land") && (
        <div className="spidey-web-line" />
      )}

      {/* Sprite */}
      <div className="spidey-character">
        <img src={src} alt="" draggable={false} />
      </div>

      {/* Speech bubble */}
      {showBubble && (
        <div className={`spidey-bubble ${phase === "idle" ? "sb-idle" : "sb-pop"}`}>
          <div className="sb-tail" />
          <span className="sb-text">{bubbleText}</span>
        </div>
      )}

      {/* Tiny impact poof on landing */}
      {phase === "land" && (
        <div className="spidey-poof">
          {[0,1,2,3,4,5].map(i => (
            <span key={i} className="poof-dot" style={{
              "--a": `${i * 60}deg`, "--d": `${10 + (i%3)*5}px`
            }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpiderManAnimation;
