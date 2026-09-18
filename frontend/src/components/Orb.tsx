export default function Orb() {
  return (
    <div className="orb-container">
      <svg
        className="orb"
        viewBox="0 0 200 200"
        width="160"
        height="160"
        aria-hidden="true"
      >
        <defs>
          {/* Deep dark glossy glass body */}
          <radialGradient id="orbGlass" cx="45%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#1a2b3c" stopOpacity="0.8" />
            <stop offset="35%" stopColor="#0a121e" />
            <stop offset="85%" stopColor="#04070c" />
            <stop offset="100%" stopColor="#010307" />
          </radialGradient>

          {/* Luminous wave gradient in SA Green, Cyan and Gold */}
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00c774" />
            <stop offset="45%" stopColor="#13a7c9" />
            <stop offset="80%" stopColor="#2a6bff" />
            <stop offset="100%" stopColor="#ffb81c" />
          </linearGradient>

          {/* Upper glass rim specular reflection */}
          <linearGradient id="specular" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Soft neon glow */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer glass sphere with rim stroke */}
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="url(#orbGlass)"
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth="1.5"
        />

        {/* Ambient lower bounce reflection */}
        <ellipse
          cx="100"
          cy="158"
          rx="52"
          ry="14"
          fill="rgba(0, 199, 116, 0.08)"
          filter="url(#neonGlow)"
        />

        {/* Center glowing S-curve / infinity wave */}
        <path
          d="M 22 108 C 65 62, 85 140, 135 96 C 158 76, 172 90, 178 94"
          fill="none"
          stroke="url(#waveGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#neonGlow)"
        />

        {/* Upper glass crescent specular reflection */}
        <path
          d="M 32 80 C 40 42, 70 24, 100 24 C 130 24, 160 42, 168 80 C 145 52, 115 42, 100 42 C 75 42, 50 54, 32 80 Z"
          fill="url(#specular)"
        />
      </svg>
    </div>
  );
}