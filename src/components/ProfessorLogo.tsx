import React from "react";

interface ProfessorLogoProps {
  className?: string;
  variant?: "full" | "logo-text" | "icon" | "academic-icon";
  light?: boolean;
}

export default function ProfessorLogo({
  className = "h-12",
  variant = "full",
  light = false,
}: ProfessorLogoProps) {
  const brandColor = light ? "#FFFFFF" : "#1b75bc";
  const textColor = light ? "#E2E8F0" : "#1b75bc";

  if (variant === "icon") {
    // Just the first O with the floor scrubber/cleaning machine on top
    return (
      <svg
        id="professor-icon-cleaning"
        viewBox="0 0 100 110"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cleaning machine accessory on top */}
        <path
          d="M48 25 C45 25, 41 22, 40 18 C39 14, 42 10, 47 10 C49 10, 52 12, 53 14 L62 8 C64 6.5, 67 7.5, 68 10 C69 12, 67.5 14, 65 15.5 L57.5 20 C55 23, 52 25, 48 25 Z"
          fill={brandColor}
        />
        <rect
          x="32"
          y="18"
          width="36"
          height="12"
          rx="4"
          fill={brandColor}
        />
        {/* The main 'O' circle */}
        <circle
          cx="50"
          cy="65"
          r="30"
          stroke={brandColor}
          strokeWidth="15"
          fill="none"
        />
      </svg>
    );
  }

  if (variant === "academic-icon") {
    // Just the second O with the graduation cap inside
    return (
      <svg
        id="professor-icon-academic"
        viewBox="0 0 100 100"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* The main 'O' circle */}
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke={brandColor}
          strokeWidth="15"
          fill="none"
        />
        {/* Graduation cap inside */}
        <path
          d="M50 38 L68 45 L50 52 L32 45 Z"
          fill={light ? "#1e293b" : "#FFFFFF"}
        />
        <path
          d="M40 49 L40 56 C40 60, 50 62, 50 62 C50 62, 60 60, 60 56 L60 49"
          fill={light ? "#1e293b" : "#FFFFFF"}
          stroke={light ? "#1e293b" : "#FFFFFF"}
          strokeWidth="1"
        />
        {/* Tassel */}
        <path
          d="M62 46.5 L65 54 L65 59"
          stroke={light ? "#1e293b" : "#FFFFFF"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Main Logo Text "PROFESSOR" with stylized O's */}
      <svg
        id="professor-full-logo"
        viewBox="0 0 660 120"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Letter P */}
        <path
          d="M25 30 H55 C70 30, 80 38, 80 50 C80 62, 70 70, 55 70 H43 V100 H25 V30 Z M43 46 V54 H53 C57 54, 61 52, 61 50 C61 48, 57 46, 53 46 H43 Z"
          fill={brandColor}
        />

        {/* Letter R */}
        <path
          d="M95 30 H125 C140 30, 150 38, 150 50 C150 60, 142 66, 133 68 L152 100 H132 L115 70 H113 V100 H95 V30 Z M113 46 V54 H123 C127 54, 131 52, 131 50 C131 48, 127 46, 123 46 H113 Z"
          fill={brandColor}
        />

        {/* Stylized O with cleaning machine on top */}
        <g>
          {/* Cleaning machine on top of first O */}
          <path
            d="M178 20 C176 20, 173 18, 172 15 C171 12, 173 9, 177 9 C179 9, 181 10, 182 12 L189 7 C191 6, 193 6.5, 194 8 C195 9.5, 194 11, 192 12 L186 16 C184 18.5, 182 20, 178 20 Z"
            fill={brandColor}
          />
          <rect
            x="166"
            y="14"
            width="28"
            height="10"
            rx="3"
            fill={brandColor}
          />
          <circle
            cx="180"
            cy="65"
            r="23"
            stroke={brandColor}
            strokeWidth="14"
            fill="none"
          />
        </g>

        {/* Letter F */}
        <path
          d="M220 30 H260 V46 H238 V57 H256 V72 H238 V100 H220 V30 Z"
          fill={brandColor}
        />

        {/* Letter E */}
        <path
          d="M275 30 H315 V46 H293 V57 H311 V72 H293 V84 H315 V100 H275 V30 Z"
          fill={brandColor}
        />

        {/* Letter S */}
        <path
          d="M360 30 H335 C328 30, 328 42, 335 42 H355 C364 42, 364 56, 355 56 H330 V46 H348 C354 46, 354 38, 348 38 H330 C322 38, 322 20, 335 20 H360 V30 Z"
          transform="translate(325, 30) scale(1.1) translate(-325, -30)"
          d-comment="Approximate S path"
          fill={brandColor}
        />
        <path
          d="M330 45 C330 35, 340 30, 355 30 C368 30, 375 36, 375 44 C375 56, 340 52, 340 62 C340 68, 350 70, 362 70 C370 70, 375 66, 375 62 H385 C385 74, 372 80, 358 80 C340 80, 330 74, 330 64 C330 52, 368 56, 368 46 C368 40, 356 40, 348 40 C340 40, 332 44, 332 48 H330 Z"
          transform="translate(330, 30)"
          fill={brandColor}
        />

        {/* Second Letter S */}
        <path
          d="M330 45 C330 35, 340 30, 355 30 C368 30, 375 36, 375 44 C375 56, 340 52, 340 62 C340 68, 350 70, 362 70 C370 70, 375 66, 375 62 H385 C385 74, 372 80, 358 80 C340 80, 330 74, 330 64 C330 52, 368 56, 368 46 C368 40, 356 40, 348 40 C340 40, 332 44, 332 48 H330 Z"
          transform="translate(400, 30)"
          fill={brandColor}
        />

        {/* Stylized O with Graduation Cap inside */}
        <g>
          <circle
            cx="520"
            cy="65"
            r="23"
            stroke={brandColor}
            strokeWidth="14"
            fill="none"
          />
          {/* Graduation Cap */}
          <path
            d="M520 54 L536 60 L520 66 L504 60 Z"
            fill={light ? "#1e293b" : "#FFFFFF"}
          />
          <path
            d="M511 63.5 L511 69 C511 72, 520 73.5, 520 73.5 C520 73.5, 529 72, 529 69 L529 63.5"
            fill={light ? "#1e293b" : "#FFFFFF"}
            stroke={light ? "#1e293b" : "#FFFFFF"}
            strokeWidth="0.8"
          />
          {/* Tassel */}
          <path
            d="M531 61.5 L533.5 67 L533.5 71"
            stroke={light ? "#1e293b" : "#FFFFFF"}
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>

        {/* Letter R */}
        <path
          d="M570 30 H600 C615 30, 625 38, 625 50 C625 60, 617 66, 608 68 L627 100 H607 L590 70 H588 V100 H570 V30 Z M588 46 V54 H598 C602 54, 606 52, 606 50 C606 48, 602 46, 598 46 H588 Z"
          fill={brandColor}
        />
      </svg>

      {variant === "full" && (
        <span
          className="text-xs font-bold tracking-[0.25em] mt-2 block"
          style={{ color: textColor, fontFamily: "'Inter', sans-serif" }}
        >
          PERFECTION IN EVERY DETAIL
        </span>
      )}
    </div>
  );
}
