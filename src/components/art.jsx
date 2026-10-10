export function PhotoArt({ id }) {
  return (
    <svg className="photo-art" viewBox="0 0 320 220" role="img" aria-hidden="true">
      {id === "flowers" ? <Flowers /> : null}
      {id === "tomatoes" ? <Tomatoes /> : null}
      {id === "porch" ? <Porch /> : null}
      {id === "rain" ? <Rain /> : null}
      {id === "cake" ? <Cake /> : null}
      {id === "drawing" ? <Drawing /> : null}
      {id === "snapshot" ? <Snapshot /> : null}
    </svg>
  );
}

function Flowers() {
  return (
    <>
      <rect width="320" height="220" fill="#d7ead2" />
      <path d="M0 170 C80 150 140 190 320 160 L320 220 L0 220 Z" fill="#6d8a52" />
      <path d="M0 188 C90 170 160 200 320 176 L320 220 L0 220 Z" fill="#4f6d3d" />
      {[70, 150, 230].map((x, index) => (
        <g key={x} transform={`translate(${x} ${118 + (index === 1 ? -16 : 0)})`}>
          <rect x="-3" y="10" width="6" height="70" fill="#2f6a3a" />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-24"
              rx="16"
              ry="8"
              fill="#f2c84b"
              transform={`rotate(${angle} 0 -24)`}
              stroke="#1c1612"
              strokeWidth="2"
            />
          ))}
          <circle cx="0" cy="-24" r="8" fill="#c46a4a" stroke="#1c1612" strokeWidth="2" />
        </g>
      ))}
    </>
  );
}

function Tomatoes() {
  return (
    <>
      <rect width="320" height="220" fill="#efe2c4" />
      <path d="M40 200 C80 80 140 40 250 70" fill="none" stroke="#3e6b45" strokeWidth="8" />
      <path d="M120 110 C150 70 190 80 200 120" fill="none" stroke="#3e6b45" strokeWidth="6" />
      <circle cx="110" cy="130" r="34" fill="#c4473a" stroke="#1c1612" strokeWidth="3" />
      <circle cx="176" cy="108" r="28" fill="#d46545" stroke="#1c1612" strokeWidth="3" />
      <circle cx="214" cy="156" r="30" fill="#a83830" stroke="#1c1612" strokeWidth="3" />
      <path d="M96 104 h28 M164 84 h22 M200 132 h24" stroke="#2f6b3a" strokeWidth="4" />
    </>
  );
}

function Porch() {
  return (
    <>
      <rect width="320" height="220" fill="#d5e4ea" />
      <rect x="70" y="54" width="180" height="130" fill="#f4e2c4" stroke="#1c1612" strokeWidth="3" />
      <polygon points="60,64 160,24 260,64" fill="#8a5a3c" stroke="#1c1612" strokeWidth="3" />
      <rect x="132" y="96" width="56" height="88" fill="#6d4a34" stroke="#1c1612" strokeWidth="3" />
      <circle cx="176" cy="142" r="4" fill="#f2c84b" />
      <rect x="40" y="168" width="240" height="16" fill="#c8b49a" stroke="#1c1612" strokeWidth="3" />
      <rect x="28" y="184" width="264" height="18" fill="#a88868" stroke="#1c1612" strokeWidth="3" />
    </>
  );
}

function Rain() {
  return (
    <>
      <rect width="320" height="220" fill="#c5d5df" />
      <rect x="48" y="28" width="224" height="164" fill="#f7f4ee" stroke="#1c1612" strokeWidth="8" />
      <path d="M160 28 v164 M48 110 h224" stroke="#1c1612" strokeWidth="6" />
      {Array.from({ length: 9 }, (_, index) => (
        <path
          key={index}
          d={`M${36 + index * 32} ${20 + (index % 3) * 18} l-10 28`}
          stroke="#3d6f86"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

function Cake() {
  return (
    <>
      <rect width="320" height="220" fill="#f6e7ef" />
      <rect x="78" y="126" width="164" height="58" rx="8" fill="#f3f0ea" stroke="#1c1612" strokeWidth="3" />
      <rect x="98" y="92" width="124" height="42" rx="8" fill="#f7d3e2" stroke="#1c1612" strokeWidth="3" />
      <rect x="118" y="64" width="84" height="34" rx="8" fill="#c46a4a" stroke="#1c1612" strokeWidth="3" />
      {[132, 160, 188].map((x) => (
        <g key={x}>
          <rect x={x - 2} y="40" width="4" height="26" fill="#1c1612" />
          <circle cx={x} cy="36" r="5" fill="#f2c84b" stroke="#1c1612" strokeWidth="2" />
        </g>
      ))}
    </>
  );
}

function Drawing() {
  return (
    <>
      <rect width="320" height="220" fill="#d8c7a4" />
      <rect x="54" y="24" width="212" height="172" fill="#fffdf8" stroke="#1c1612" strokeWidth="3" />
      <polygon points="110,110 160,68 210,110" fill="none" stroke="#2a62a8" strokeWidth="5" />
      <rect x="124" y="110" width="72" height="58" fill="none" stroke="#2a62a8" strokeWidth="5" />
      <rect x="148" y="136" width="22" height="32" fill="none" stroke="#c46a4a" strokeWidth="4" />
      <circle cx="214" cy="58" r="16" fill="none" stroke="#d39a14" strokeWidth="4" />
    </>
  );
}

function Snapshot() {
  return (
    <>
      <rect width="320" height="220" fill="#dfe7d4" />
      <circle cx="230" cy="52" r="22" fill="#f2c84b" stroke="#1c1612" strokeWidth="3" />
      <path d="M0 160 L90 100 L150 140 L220 80 L320 150 L320 220 L0 220 Z" fill="#6d8a52" />
      <rect x="24" y="24" width="70" height="48" fill="none" stroke="#1c1612" strokeWidth="4" />
    </>
  );
}

export function Avatar({ initials, pattern }) {
  return (
    <svg className="avatar" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="34" fill="#fbf7f1" stroke="#1c1612" strokeWidth="3" />
      {pattern === "petals" ? (
        <g fill="none" stroke="#1f4f45" strokeWidth="3">
          <circle cx="36" cy="36" r="10" />
          <circle cx="36" cy="16" r="6" />
          <circle cx="36" cy="56" r="6" />
          <circle cx="16" cy="36" r="6" />
          <circle cx="56" cy="36" r="6" />
        </g>
      ) : null}
      {pattern === "stripes" ? (
        <g stroke="#8a5a3c" strokeWidth="3">
          <path d="M18 20 h36 M18 32 h36 M18 44 h36 M18 56 h36" />
        </g>
      ) : null}
      {pattern === "dots" ? (
        <g fill="#1f4f45">
          {[22, 36, 50].map((y) =>
            [22, 36, 50].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />),
          )}
        </g>
      ) : null}
      {pattern === "rings" ? (
        <g fill="none" stroke="#3d6f86" strokeWidth="3">
          <circle cx="36" cy="36" r="12" />
          <circle cx="36" cy="36" r="22" />
        </g>
      ) : null}
      {pattern === "waves" ? (
        <g fill="none" stroke="#c46a4a" strokeWidth="3">
          <path d="M14 28c8 8 14-8 22 0s14-8 22 0" />
          <path d="M14 40c8 8 14-8 22 0s14-8 22 0" />
          <path d="M14 52c8 8 14-8 22 0s14-8 22 0" />
        </g>
      ) : null}
      <text
        x="36"
        y="41"
        textAnchor="middle"
        fontSize="16"
        fontFamily="Atkinson Hyperlegible, Segoe UI, sans-serif"
        fontWeight="700"
        fill="#1c1612"
      >
        {initials}
      </text>
    </svg>
  );
}

export function LessonThumb({ id }) {
  return (
    <svg className="lesson-thumb" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={id === "safety" ? "#c9c3dc" : "#ccbfd4"} />
          <stop offset="1" stopColor={id === "safety" ? "#f6cfb4" : "#f7c9ac"} />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop offset="0" stopColor="#6b4a4a" stopOpacity="0.32" />
          <stop offset="1" stopColor="#6b4a4a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-coral`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a7a" />
          <stop offset="1" stopColor="#ec6458" />
        </linearGradient>
        <linearGradient id={`${id}-mustard`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2b24e" />
          <stop offset="1" stopColor="#d48632" />
        </linearGradient>
        <linearGradient id={`${id}-mint`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a6e6d2" />
          <stop offset="1" stopColor="#6fc8b0" />
        </linearGradient>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf5" />
          <stop offset="1" stopColor="#f1e6dc" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#${id}-bg)`} />
      <ellipse cx="200" cy="330" rx="150" ry="22" fill={`url(#${id}-shadow)`} />
      {id === "community" ? (
        <g transform="translate(200 210) scale(0.82) translate(-200 -210)">
          <g transform="rotate(-6 190 200)">
            <rect x="96" y="104" width="190" height="200" rx="30" fill={`url(#${id}-coral)`} />
            <rect x="96" y="104" width="190" height="56" rx="28" fill="#f2584d" />
            <rect x="114" y="150" width="154" height="136" rx="18" fill={`url(#${id}-paper)`} />
            {[0, 1, 2].map((row) => [0, 1, 2, 3].map((col) => (
              <rect key={`${row}-${col}`} x={128 + col * 34} y={166 + row * 38} width="24" height="24" rx="7" fill={row === 1 && col === 2 ? "#6fc8b0" : "#efd9cb"} />
            )))}
            <rect x="136" y="88" width="18" height="40" rx="9" fill="#d9d2cc" />
            <rect x="228" y="88" width="18" height="40" rx="9" fill="#d9d2cc" />
            <path d="M110 120c20-8 50-10 70-8" stroke="#fff" strokeOpacity="0.35" strokeWidth="8" strokeLinecap="round" fill="none" />
          </g>
          <g transform="rotate(14 290 140)">
            <path d="M290 86c-30 0-46 22-46 50v26l-14 18h120l-14-18v-26c0-28-16-50-46-50Z" fill={`url(#${id}-mustard)`} />
            <circle cx="290" cy="192" r="13" fill="#c97a2c" />
            <path d="M262 120c4-12 12-20 22-22" stroke="#fff" strokeOpacity="0.45" strokeWidth="7" strokeLinecap="round" fill="none" />
          </g>
          <path d="M318 262l7 14 15 2-11 10 3 15-14-7-14 7 3-15-11-10 15-2Z" fill="#5fc0a8" />
        </g>
      ) : null}
      {id === "safety" ? (
        <g transform="translate(200 210) scale(0.82) translate(-200 -210)">
          <g transform="rotate(-8 180 200)">
            <rect x="110" y="70" width="150" height="250" rx="34" fill="#3b3a44" />
            <rect x="122" y="84" width="126" height="222" rx="24" fill={`url(#${id}-paper)`} />
            <rect x="136" y="116" width="86" height="44" rx="18" fill="#e3dcd6" />
            <rect x="136" y="172" width="98" height="58" rx="18" fill="#e3dcd6" />
            <rect x="148" y="190" width="60" height="8" rx="4" fill="#a9c8ea" />
            <rect x="148" y="206" width="40" height="8" rx="4" fill="#a9c8ea" />
          </g>
          <g transform="rotate(8 270 140)">
            <path d="M222 92h96a30 30 0 0 1 30 30v26a30 30 0 0 1-30 30h-50l-26 22 6-22h-26a30 30 0 0 1-30-30v-26a30 30 0 0 1 30-30Z" fill={`url(#${id}-mustard)`} />
            <path d="M270 110l30 52h-60Z" fill="#fff8ee" strokeLinejoin="round" stroke="#fff8ee" strokeWidth="8" />
            <rect x="266" y="124" width="8" height="22" rx="4" fill="#d48632" />
            <circle cx="270" cy="154" r="4.5" fill="#d48632" />
            <path d="M210 106c10-6 22-8 34-8" stroke="#fff" strokeOpacity="0.45" strokeWidth="7" strokeLinecap="round" fill="none" />
          </g>
          <g transform="rotate(-10 120 270)">
            <path d="M120 216l52 20v34c0 34-24 56-52 66-28-10-52-32-52-66v-34Z" fill={`url(#${id}-mint)`} />
            <path d="M98 274l16 16 30-34" stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M80 244l30-12" stroke="#fff" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" />
          </g>
        </g>
      ) : null}
    </svg>
  );
}

export function PlaceArt({ id, unlocked }) {
  return (
    <svg className="place-art" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="360" height="200" fill={{ family: "#e5effc", community: "#fbe9e7", cafe: "#e4f2e8", safety: "#fff2d8" }[id] ?? "#e4efe6"} />
      <circle cx="180" cy="100" r="71" fill="#fff" opacity="0.7" />
      <g fill="none" stroke={{ family: "#087aff", community: "#e5493f", cafe: "#24894a", safety: "#9b650d" }[id] ?? "#1f4f45"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        {id === "family" ? <><rect x="130" y="55" width="100" height="85" rx="12" /><circle cx="157" cy="80" r="8" /><path d="m140 125 26-28 19 20 16-17 19 25" /><path d="M232 148h24m-10-10 10 10-10 10" /></> : null}
        {id === "community" ? <><rect x="132" y="57" width="96" height="90" rx="12" /><path d="M155 47v23m50-23v23m-73 12h96" /><path d="M151 102h9m20 0h9m-38 23h9" /><circle cx="218" cy="132" r="25" fill="#fff" /><path d="M218 119v14l9 5" /></> : null}
        {id === "cafe" ? <><path d="m145 57 17-6 15 28-16 13c8 17 20 29 36 37l13-16 28 15-6 17c-4 11-22 11-45-2-24-14-46-36-55-59-5-13-3-22 13-27Z" /><path d="M203 54c18 2 32 16 34 34m-31-18c8 1 14 7 15 15" /></> : null}
        {id === "safety" ? <><path d="M135 61h91a12 12 0 0 1 12 12v54a12 12 0 0 1-12 12h-58l-27 19 5-19h-11a12 12 0 0 1-12-12V73a12 12 0 0 1 12-12Z" /><path d="M180 79v29m0 13v1" /></> : null}
      </g>
      {unlocked ? <g><circle cx="304" cy="153" r="19" fill="#24894a" /><path d="m295 153 6 6 12-13" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g> : null}
    </svg>
  );
}

function FamilyHouse({ unlocked }) {
  return (
    <g>
      <rect x="118" y="78" width="140" height="90" fill="#f4e2c4" stroke="#1c1612" strokeWidth="3" />
      <polygon points="104,82 188,34 272,82" fill="#8a5a3c" stroke="#1c1612" strokeWidth="3" />
      <rect x="168" y="112" width="40" height="56" fill="#6d4a34" stroke="#1c1612" strokeWidth="3" />
      <rect x="136" y="98" width="28" height="28" fill={unlocked ? "#f2c84b" : "#fbf7f1"} stroke="#1c1612" strokeWidth="3" />
      <rect x="214" y="98" width="28" height="28" fill={unlocked ? "#f2c84b" : "#fbf7f1"} stroke="#1c1612" strokeWidth="3" />
      <path d="M132 112h8M150 112h8M136 98v28M214 112h8M232 112h8M218 98v28" stroke="#1c1612" strokeWidth="2" />
      <circle cx="86" cy="120" r="26" fill="#3e6b45" />
      <rect x="82" y="120" width="8" height="48" fill="#6d4a34" />
      <g transform="translate(40 150)">
        <rect width="70" height="18" rx="4" fill="#6d8a52" stroke="#1c1612" strokeWidth="2" />
        <circle cx="16" cy="4" r="8" fill="#f2c84b" stroke="#1c1612" strokeWidth="2" />
        <circle cx="36" cy="2" r="8" fill="#f2c84b" stroke="#1c1612" strokeWidth="2" />
        <circle cx="54" cy="6" r="8" fill="#f2c84b" stroke="#1c1612" strokeWidth="2" />
      </g>
    </g>
  );
}

function Community() {
  return (
    <g>
      <rect x="70" y="70" width="220" height="98" fill="#f7f1e6" stroke="#1c1612" strokeWidth="3" />
      <polygon points="58,74 180,28 302,74" fill="#1f4f45" stroke="#1c1612" strokeWidth="3" />
      {[100, 150, 200, 250].map((x) => (
        <rect key={x} x={x} y="108" width="22" height="60" fill="#d5e4ea" stroke="#1c1612" strokeWidth="3" />
      ))}
    </g>
  );
}

function Cafe() {
  return (
    <g>
      <rect x="86" y="86" width="188" height="82" fill="#fbf7f1" stroke="#1c1612" strokeWidth="3" />
      <path d="M74 86 h212 l-16 -28 h-180 z" fill="#c46a4a" stroke="#1c1612" strokeWidth="3" />
      <rect x="118" y="104" width="40" height="40" fill="#d5e4ea" stroke="#1c1612" strokeWidth="3" />
      <rect x="176" y="118" width="70" height="50" fill="#6d4a34" stroke="#1c1612" strokeWidth="3" />
      <circle cx="250" cy="78" r="16" fill="#fbf7f1" stroke="#1c1612" strokeWidth="3" />
      <path d="M266 78 h16 v10 h-12" fill="none" stroke="#1c1612" strokeWidth="3" />
    </g>
  );
}

function Safety() {
  return (
    <g>
      <rect x="96" y="78" width="168" height="90" fill="#f7f1e6" stroke="#1c1612" strokeWidth="3" />
      <polygon points="96,78 180,40 264,78" fill="#3d6f86" stroke="#1c1612" strokeWidth="3" />
      <circle cx="180" cy="118" r="26" fill="#fbf7f1" stroke="#1c1612" strokeWidth="3" />
      <path d="M180 100 v22 M170 112 h20" stroke="#1c1612" strokeWidth="4" />
      <rect x="164" y="150" width="32" height="18" fill="#1f4f45" />
    </g>
  );
}

export function CheckIcon() {
  return (
    <svg className="check-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 12.5 l3.2 3.2 L17 9" fill="none" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}
