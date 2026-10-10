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

export function PlaceArt({ id, unlocked }) {
  return (
    <svg className="place-art" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="360" height="200" fill={id === "cafe" ? "#f6e7d4" : "#e4efe6"} />
      <path d="M0 168h360v32H0z" fill="#d7c4a4" />
      {id === "family" ? <FamilyHouse unlocked={unlocked} /> : null}
      {id === "community" ? <Community /> : null}
      {id === "cafe" ? <Cafe /> : null}
      {id === "safety" ? <Safety /> : null}
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
