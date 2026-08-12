/**
 * Hand-drawn SVG illustrations for each product type.
 *
 * These stand in for photography: they render crisply at any size, cost
 * almost nothing to load, and keep the catalog visually consistent. A
 * product with a real `imageUrl` uses the photo instead (see ProductImage).
 *
 * Every illustration draws inside a 100x100 viewBox.
 */

type ArtProps = { className?: string };

const shadow = (
  <ellipse cx="50" cy="88" rx="30" ry="5" fill="#2b1808" opacity="0.18" />
);

/* ---------------------------------- Figs --------------------------------- */

function Fig({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Fig">
      <defs>
        <radialGradient id="figBody" cx="38%" cy="30%">
          <stop offset="0%" stopColor="#a8703f" />
          <stop offset="55%" stopColor="#7d4a24" />
          <stop offset="100%" stopColor="#4e2a13" />
        </radialGradient>
      </defs>
      {shadow}
      {/* back fig — same teardrop, tucked behind and dimmed */}
      <g opacity="0.8" transform="translate(-19 6) scale(0.82)">
        <path
          d="M50 26c1 6 3 10 7 13 7 5 11 13 11 22 0 13-8 22-18 22s-18-9-18-22c0-9 4-17 11-22 4-3 6-7 7-13z"
          fill="#63391b"
        />
        <path d="M50 27c-1-5-1-8 0-12 1 4 1 7 0 12z" fill="#3d2110" />
      </g>
      {/* main fig: bulbous body tapering to a narrow neck */}
      <path
        d="M50 24c1.5 7 3.5 11.5 8 15 8 6 13 15 13 25 0 15-9 25-21 25s-21-10-21-25c0-10 5-19 13-25 4.5-3.5 6.5-8 8-15z"
        fill="url(#figBody)"
      />
      {/* ribbing following the body's curve */}
      <g stroke="#3d2110" strokeWidth="0.85" opacity="0.32" fill="none">
        <path d="M50 32c0 18 0 32 0 44" />
        <path d="M58 36c4 15 4 27 2 40" />
        <path d="M42 36c-4 15-4 27-2 40" />
        <path d="M65 46c3 11 3 21 1 30" />
        <path d="M35 46c-3 11-3 21-1 30" />
      </g>
      {/* stem and leaf */}
      <path d="M50 24c-1-6-1-10 0-15 1 5 1 9 0 15z" fill="#4a6b2a" />
      <path d="M50 14c3-5 8-7 14-7-2 6-7 9-14 9z" fill="#5c8034" />
      <path d="M50 16c-3-4-7-5-12-5 2 4 6 6 12 6z" fill="#4a6b2a" opacity="0.85" />
      {/* highlight down the left shoulder */}
      <ellipse
        cx="41"
        cy="56"
        rx="6"
        ry="12"
        fill="#d69a5c"
        opacity="0.32"
        transform="rotate(-12 41 56)"
      />
    </svg>
  );
}

/* --------------------------------- Dates --------------------------------- */

function Dates({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Dates">
      <defs>
        <linearGradient id="dateBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a4b22" />
          <stop offset="55%" stopColor="#5b2c12" />
          <stop offset="100%" stopColor="#331708" />
        </linearGradient>
      </defs>
      {shadow}
      {[
        { x: 30, y: 58, r: -18 },
        { x: 68, y: 56, r: 16 },
        { x: 49, y: 48, r: 0 },
      ].map((d, i) => (
        <g key={i} transform={`translate(${d.x} ${d.y}) rotate(${d.r})`}>
          <ellipse rx="13" ry="21" fill="url(#dateBody)" />
          <ellipse
            cx="-4"
            cy="-6"
            rx="4"
            ry="8"
            fill="#b9743a"
            opacity="0.4"
          />
          {/* wrinkles */}
          <g stroke="#2a1206" strokeWidth="0.7" opacity="0.4" fill="none">
            <path d="M-7 -8c3 6 3 12 1 18" />
            <path d="M0 -14c2 9 2 18 0 26" />
            <path d="M7 -8c-2 6-2 12 0 17" />
          </g>
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------- Almonds -------------------------------- */

function Almond({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Almonds">
      <defs>
        <linearGradient id="almondBody" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#d9a06a" />
          <stop offset="60%" stopColor="#b97a45" />
          <stop offset="100%" stopColor="#8a5326" />
        </linearGradient>
      </defs>
      {shadow}
      {[
        { x: 32, y: 60, r: -24 },
        { x: 67, y: 58, r: 22 },
        { x: 50, y: 46, r: -4 },
      ].map((a, i) => (
        <g key={i} transform={`translate(${a.x} ${a.y}) rotate(${a.r})`}>
          <path
            d="M0 -22c9 0 14 10 14 21 0 9-6 15-14 15s-14-6-14-15c0-11 5-21 14-21z"
            fill="url(#almondBody)"
          />
          <path
            d="M0 -18c5 0 8 8 8 17"
            stroke="#7a4720"
            strokeWidth="0.9"
            fill="none"
            opacity="0.5"
          />
          <ellipse cx="-4" cy="-4" rx="3.5" ry="8" fill="#e8c193" opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------- Walnuts -------------------------------- */

function Walnut({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Walnut halves">
      <defs>
        <radialGradient id="walnutBody" cx="40%" cy="32%">
          <stop offset="0%" stopColor="#e2bd8c" />
          <stop offset="60%" stopColor="#c2914f" />
          <stop offset="100%" stopColor="#8a5e2a" />
        </radialGradient>
      </defs>
      {shadow}
      {/* back half */}
      <g transform="translate(30 60) rotate(-14)" opacity="0.85">
        <ellipse rx="19" ry="17" fill="url(#walnutBody)" />
        <path
          d="M0 -16c-6 5-9 11-9 16 0 4 3 8 9 8"
          stroke="#7a5124"
          strokeWidth="1.1"
          fill="none"
          opacity="0.55"
        />
      </g>
      {/* front half with convoluted kernel */}
      <g transform="translate(60 54) rotate(10)">
        <ellipse rx="22" ry="20" fill="url(#walnutBody)" />
        <g stroke="#82571f" strokeWidth="1.2" fill="none" opacity="0.6">
          <path d="M0 -19v38" />
          <path d="M-6 -14c-7 5-9 12-6 18 2 5 7 8 12 9" />
          <path d="M6 -14c7 5 9 12 6 18-2 5-7 8-12 9" />
          <path d="M-12 -2c4-2 7-1 9 2" />
          <path d="M12 -2c-4-2-7-1-9 2" />
        </g>
        <ellipse cx="-7" cy="-8" rx="5" ry="4" fill="#f0d6ac" opacity="0.45" />
      </g>
    </svg>
  );
}

/* ------------------------------- Pistachios ------------------------------ */

function Pistachio({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Pistachios">
      <defs>
        <linearGradient id="pistShell" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#efdcb8" />
          <stop offset="100%" stopColor="#c9ab77" />
        </linearGradient>
      </defs>
      {shadow}
      {[
        { x: 33, y: 60, r: -20 },
        { x: 68, y: 57, r: 18 },
        { x: 50, y: 45, r: 2 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.r})`}>
          <ellipse rx="15" ry="19" fill="url(#pistShell)" />
          {/* split showing the green kernel */}
          <path
            d="M-3 -18c-4 8-4 26 0 36 5 1 9-2 10-6-6-8-6-16 0-24-1-4-5-7-10-6z"
            fill="#7f9a3e"
          />
          <path
            d="M-1 -14c-3 7-3 21 0 28"
            stroke="#5e7a28"
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />
          <ellipse cx="6" cy="-7" rx="4" ry="6" fill="#fff6e2" opacity="0.55" />
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------- Raisins -------------------------------- */

function Raisins({ className, dark = false }: ArtProps & { dark?: boolean }) {
  const top = dark ? "#5b3a5e" : "#a5722f";
  const mid = dark ? "#3a2140" : "#7b4d18";
  const low = dark ? "#221328" : "#4c2d0c";
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Raisins">
      <defs>
        <radialGradient id={`raisin-${dark ? "d" : "l"}`} cx="38%" cy="30%">
          <stop offset="0%" stopColor={top} />
          <stop offset="60%" stopColor={mid} />
          <stop offset="100%" stopColor={low} />
        </radialGradient>
      </defs>
      {shadow}
      {[
        [34, 64, 11, -20],
        [64, 66, 12, 15],
        [49, 52, 13, 4],
        [30, 45, 9, 25],
        [70, 45, 9, -18],
        [50, 74, 9, 10],
      ].map(([x, y, r, rot], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <ellipse rx={r} ry={r * 0.78} fill={`url(#raisin-${dark ? "d" : "l"})`} />
          <g stroke={low} strokeWidth="0.6" opacity="0.5" fill="none">
            <path d={`M${-r * 0.5} -2c${r * 0.5} 3 ${r * 0.8} 3 ${r} 0`} />
            <path d={`M${-r * 0.5} 3c${r * 0.5} 3 ${r * 0.8} 2 ${r} -1`} />
          </g>
          <ellipse
            cx={-r * 0.3}
            cy={-r * 0.3}
            rx={r * 0.25}
            ry={r * 0.18}
            fill="#fff"
            opacity="0.25"
          />
        </g>
      ))}
    </svg>
  );
}

/* --------------------------------- Seeds --------------------------------- */

function Seeds({ className, melon = false }: ArtProps & { melon?: boolean }) {
  const fill = melon ? "#4a3320" : "#8f9a52";
  const edge = melon ? "#2c1c0e" : "#647037";
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Seeds">
      {shadow}
      {[
        [32, 62, -30],
        [50, 68, 8],
        [68, 60, 28],
        [40, 48, -12],
        [60, 46, 16],
        [50, 34, 0],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse rx="9" ry="13" fill={fill} />
          <ellipse rx="9" ry="13" fill="none" stroke={edge} strokeWidth="1.4" />
          <ellipse cx="-2.5" cy="-4" rx="2.5" ry="4.5" fill="#fff" opacity="0.3" />
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------- Saffron -------------------------------- */

function Saffron({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Saffron threads">
      <defs>
        <linearGradient id="saffronThread" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8532a" />
          <stop offset="60%" stopColor="#b81f18" />
          <stop offset="100%" stopColor="#7d0f0c" />
        </linearGradient>
      </defs>
      {shadow}
      {/* scattered threads, each a stigma with a flared tip */}
      {[
        { x: 30, y: 62, r: -38 },
        { x: 47, y: 70, r: 12 },
        { x: 64, y: 60, r: 42 },
        { x: 38, y: 44, r: -14 },
        { x: 60, y: 42, r: 22 },
        { x: 50, y: 54, r: -2 },
      ].map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y}) rotate(${t.r})`}>
          <path
            d="M0 14c-1.6-8-1.6-16 0-24 2.6-2 5-1 5.5 2 .6 3.6-2 5.5-2.4 8.6-.4 4 .6 9 .4 13z"
            fill="url(#saffronThread)"
          />
          <path
            d="M0 12c-1-7-1-14 0-21"
            stroke="#f0a24a"
            strokeWidth="0.7"
            opacity="0.5"
            fill="none"
          />
        </g>
      ))}
    </svg>
  );
}

/* --------------------------------- Coffee -------------------------------- */

function Coffee({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Coffee beans">
      <defs>
        <radialGradient id="beanBody" cx="38%" cy="30%">
          <stop offset="0%" stopColor="#7a4a24" />
          <stop offset="60%" stopColor="#4a2611" />
          <stop offset="100%" stopColor="#2a1408" />
        </radialGradient>
      </defs>
      {shadow}
      {[
        { x: 33, y: 62, r: -26 },
        { x: 67, y: 60, r: 24 },
        { x: 50, y: 46, r: 6 },
      ].map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${b.r})`}>
          <ellipse rx="15" ry="20" fill="url(#beanBody)" />
          {/* the signature crease */}
          <path
            d="M0 -17c-4 5-4 11-1 17 3 5 3 11 0 17"
            stroke="#c99a5e"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="-5" cy="-7" rx="3.5" ry="6" fill="#a9713c" opacity="0.4" />
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------- Apricot -------------------------------- */

function Apricot({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Dried apricots">
      <defs>
        <radialGradient id="apricotBody" cx="38%" cy="32%">
          <stop offset="0%" stopColor="#f0a63f" />
          <stop offset="60%" stopColor="#d97d20" />
          <stop offset="100%" stopColor="#9c4f0e" />
        </radialGradient>
      </defs>
      {shadow}
      {[
        { x: 34, y: 60, r: -16, s: 0.92 },
        { x: 66, y: 58, r: 18, s: 0.9 },
        { x: 50, y: 48, r: 2, s: 1 },
      ].map((a, i) => (
        <g key={i} transform={`translate(${a.x} ${a.y}) rotate(${a.r}) scale(${a.s})`}>
          <circle r="18" fill="url(#apricotBody)" />
          {/* pitted centre dimple */}
          <ellipse rx="7" ry="5" fill="#9c4f0e" opacity="0.45" />
          <ellipse rx="4.5" ry="3" fill="#7d3c08" opacity="0.5" />
          <ellipse cx="-7" cy="-8" rx="5" ry="4" fill="#ffd08a" opacity="0.45" />
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------- Berries -------------------------------- */

function Berry({ className, plum = false }: ArtProps & { plum?: boolean }) {
  const a = plum ? "#7b2b4a" : "#4a5aa8";
  const b = plum ? "#4a1226" : "#232f6b";
  const c = plum ? "#2a0916" : "#131a3f";
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Berries">
      <defs>
        <radialGradient id={`berry-${plum ? "p" : "b"}`} cx="36%" cy="30%">
          <stop offset="0%" stopColor={a} />
          <stop offset="60%" stopColor={b} />
          <stop offset="100%" stopColor={c} />
        </radialGradient>
      </defs>
      {shadow}
      {[
        [34, 62, 14],
        [66, 60, 15],
        [50, 46, 16],
        [40, 40, 9],
        [62, 38, 8],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r={r} fill={`url(#berry-${plum ? "p" : "b"})`} />
          {/* crown at the blossom end */}
          <g stroke={c} strokeWidth="1.1" opacity="0.6" fill="none">
            <path d={`M${-r * 0.3} ${-r * 0.15}l${r * 0.3} ${-r * 0.25} ${r * 0.3} ${r * 0.25}`} />
          </g>
          <ellipse
            cx={-r * 0.32}
            cy={-r * 0.36}
            rx={r * 0.28}
            ry={r * 0.2}
            fill="#fff"
            opacity="0.28"
          />
        </g>
      ))}
    </svg>
  );
}

/* ---------------------------------- Amla --------------------------------- */

function Amla({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Sweet amla">
      <defs>
        <radialGradient id="amlaBody" cx="36%" cy="30%">
          <stop offset="0%" stopColor="#d7e07a" />
          <stop offset="55%" stopColor="#a8bb3f" />
          <stop offset="100%" stopColor="#6c7d1d" />
        </radialGradient>
      </defs>
      {shadow}
      {[
        { x: 34, y: 60, r: 17 },
        { x: 66, y: 58, r: 18 },
        { x: 50, y: 45, r: 19 },
      ].map((a, i) => (
        <g key={i} transform={`translate(${a.x} ${a.y})`}>
          <circle r={a.r} fill="url(#amlaBody)" />
          {/* the six characteristic lobes */}
          <g stroke="#6c7d1d" strokeWidth="1" opacity="0.55" fill="none">
            {[0, 60, 120].map((deg) => (
              <path
                key={deg}
                d={`M0 ${-a.r}A${a.r} ${a.r} 0 0 1 0 ${a.r}`}
                transform={`rotate(${deg})`}
              />
            ))}
          </g>
          <ellipse cx={-a.r * 0.35} cy={-a.r * 0.4} rx="4" ry="3" fill="#f2f7c4" opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

/* ---------------------------------- Kiwi --------------------------------- */

function Kiwi({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Dried kiwi slices">
      {shadow}
      {[
        { x: 34, y: 62, r: 17 },
        { x: 66, y: 58, r: 18 },
        { x: 50, y: 44, r: 20 },
      ].map((k, i) => (
        <g key={i} transform={`translate(${k.x} ${k.y})`}>
          <circle r={k.r} fill="#7a9a34" />
          <circle r={k.r * 0.86} fill="#a8c452" />
          <circle r={k.r * 0.34} fill="#f2f3d8" />
          {/* seeds radiating from the pale core */}
          <g fill="#2f2a12">
            {Array.from({ length: 12 }).map((_, s) => {
              const ang = (s / 12) * Math.PI * 2;
              return (
                <ellipse
                  key={s}
                  cx={Math.cos(ang) * k.r * 0.52}
                  cy={Math.sin(ang) * k.r * 0.52}
                  rx="1.5"
                  ry="2.2"
                  transform={`rotate(${(s / 12) * 360} ${Math.cos(ang) * k.r * 0.52} ${
                    Math.sin(ang) * k.r * 0.52
                  })`}
                />
              );
            })}
          </g>
          {/* radial flesh striations */}
          <g stroke="#f2f3d8" strokeWidth="0.7" opacity="0.55">
            {Array.from({ length: 16 }).map((_, s) => {
              const ang = (s / 16) * Math.PI * 2;
              return (
                <line
                  key={s}
                  x1={Math.cos(ang) * k.r * 0.36}
                  y1={Math.sin(ang) * k.r * 0.36}
                  x2={Math.cos(ang) * k.r * 0.82}
                  y2={Math.sin(ang) * k.r * 0.82}
                />
              );
            })}
          </g>
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------- Chillies ------------------------------- */

function Chilli({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Red chillies">
      <defs>
        <linearGradient id="chilliBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d62b1c" />
          <stop offset="60%" stopColor="#9e1410" />
          <stop offset="100%" stopColor="#5e0806" />
        </linearGradient>
      </defs>
      {shadow}
      {[
        { x: 34, y: 30, r: -12 },
        { x: 66, y: 28, r: 14 },
        { x: 50, y: 26, r: 0 },
      ].map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.r})`}>
          <path
            d="M0 4c7 2 11 9 11 19 0 13-5 24-11 30-6-6-11-17-11-30 0-10 4-17 11-19z"
            fill="url(#chilliBody)"
          />
          <path
            d="M0 10c3 8 3 24 0 38"
            stroke="#f06a4a"
            strokeWidth="1.1"
            fill="none"
            opacity="0.45"
          />
          {/* calyx + stem */}
          <path d="M-6 5c3-3 9-3 12 0-2 3-10 3-12 0z" fill="#4f6b26" />
          <path d="M0 4V-6" stroke="#4f6b26" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------ Black pepper ----------------------------- */

function Pepper({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Black peppercorns">
      <defs>
        <radialGradient id="cornBody" cx="36%" cy="30%">
          <stop offset="0%" stopColor="#6b5a48" />
          <stop offset="55%" stopColor="#3d3025" />
          <stop offset="100%" stopColor="#1c1510" />
        </radialGradient>
      </defs>
      {shadow}
      {[
        [34, 62, 12],
        [64, 64, 11],
        [50, 50, 13],
        [32, 44, 9],
        [68, 44, 9],
        [50, 74, 9],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r={r} fill="url(#cornBody)" />
          {/* wrinkled surface */}
          <g stroke="#100b07" strokeWidth="0.7" opacity="0.55" fill="none">
            <path d={`M${-r * 0.6} ${-r * 0.2}q${r * 0.6} ${r * 0.4} ${r * 1.2} 0`} />
            <path d={`M${-r * 0.5} ${r * 0.3}q${r * 0.5} ${r * 0.35} ${r} 0`} />
            <path d={`M${-r * 0.2} ${-r * 0.7}q${r * 0.3} ${r * 0.7} 0 ${r * 1.4}`} />
          </g>
          <ellipse
            cx={-r * 0.35}
            cy={-r * 0.4}
            rx={r * 0.22}
            ry={r * 0.16}
            fill="#fff"
            opacity="0.22"
          />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------- Art registry ---------------------------- */

export const PRODUCT_ART = {
  fig: Fig,
  dates: Dates,
  almond: Almond,
  walnut: Walnut,
  pistachio: Pistachio,
  raisinGolden: (p: ArtProps) => <Raisins {...p} />,
  raisinBlack: (p: ArtProps) => <Raisins {...p} dark />,
  pumpkinSeed: (p: ArtProps) => <Seeds {...p} />,
  melonSeed: (p: ArtProps) => <Seeds {...p} melon />,
  saffron: Saffron,
  coffee: Coffee,
  apricot: Apricot,
  blueberry: (p: ArtProps) => <Berry {...p} />,
  plum: (p: ArtProps) => <Berry {...p} plum />,
  amla: Amla,
  kiwi: Kiwi,
  chilli: Chilli,
  pepper: Pepper,
} as const;

export type ArtKey = keyof typeof PRODUCT_ART;

/**
 * Picks an illustration from the product name, falling back to the category.
 * Order matters — the most specific match wins.
 */
export function resolveArtKey(name: string, categorySlug?: string): ArtKey {
  const n = name.toLowerCase();

  const byName: [RegExp, ArtKey][] = [
    [/anjeer|fig/, "fig"],
    [/saffron|kesar/, "saffron"],
    [/walnut/, "walnut"],
    [/almond/, "almond"],
    [/pista/, "pistachio"],
    [/black raisin/, "raisinBlack"],
    [/raisin/, "raisinGolden"],
    [/pumpkin/, "pumpkinSeed"],
    [/watermelon/, "melonSeed"],
    [/apricot/, "apricot"],
    [/blue ?berry/, "blueberry"],
    [/black ?berry|plum/, "plum"],
    [/amla/, "amla"],
    [/kiwi/, "kiwi"],
    [/chilli|chili/, "chilli"],
    [/pepper/, "pepper"],
    [/coffee/, "coffee"],
    [/date|safawi|khudri|medjool|mabroom|mashooq|tunisian/, "dates"],
  ];
  for (const [re, key] of byName) if (re.test(n)) return key;

  const byCategory: Record<string, ArtKey> = {
    "figs-anjeer": "fig",
    dates: "dates",
    nuts: "almond",
    raisins: "raisinGolden",
    seeds: "pumpkinSeed",
    "dried-fruits-berries": "apricot",
    "saffron-kesar": "saffron",
    coffee: "coffee",
    spices: "chilli",
  };
  return (categorySlug && byCategory[categorySlug]) || "fig";
}
