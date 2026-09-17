import React from 'react';

interface MilestoneLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const MilestoneLogo: React.FC<MilestoneLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = true,
}) => {
  // Height configurations
  const heightMap = {
    sm: 48,
    md: 68,
    lg: 84,
  };

  const currentHeight = heightMap[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 460 96"
        style={{ height: `${currentHeight}px`, width: 'auto' }}
        className="overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Milestone Domestic Services Ltd"
      >
        {/* ICON GRAPHIC */}
        <g transform="translate(6, 4)">
          {/* Green Roof / Shelter */}
          <path
            d="M 45 4 L 84 35 L 76 41 L 45 15 L 14 41 L 6 35 Z"
            fill="#235c27"
          />

          {/* Left Person (Sky Blue / Cyan) */}
          <circle cx="31" cy="36" r="5.5" fill="#009fe3" />
          <path
            d="M 22 55 C 22 45, 40 45, 40 55 C 40 57, 22 57, 22 55 Z"
            fill="#009fe3"
          />

          {/* Center Person (Forest Green, Taller) */}
          <circle cx="45" cy="28" r="6" fill="#235c27" />
          <path
            d="M 35 55 C 35 42, 55 42, 55 55 C 55 57, 35 57, 35 55 Z"
            fill="#235c27"
          />

          {/* Right Person (Deep Purple) */}
          <circle cx="59" cy="36" r="5.5" fill="#52247f" />
          <path
            d="M 50 55 C 50 45, 68 45, 68 55 C 68 57, 50 57, 50 55 Z"
            fill="#52247f"
          />

          {/* Supporting Protective Hands (Black/Dark Charcoal) */}
          {/* Left Hand Arm & Cupped Fingers */}
          <path
            d="M 12 44 C 13 54, 18 64, 30 71 C 36 74, 43 75, 45 75 C 41 74, 33 71, 26 65 C 19 59, 15 51, 13 44 Z"
            fill="#1a1a1a"
          />
          {/* Right Hand Arm & Cupped Fingers */}
          <path
            d="M 78 44 C 77 54, 72 64, 60 71 C 54 74, 47 75, 45 75 C 49 74, 57 71, 64 65 C 71 59, 75 51, 77 44 Z"
            fill="#1a1a1a"
          />
          {/* Solid Cradle Contour */}
          <path
            d="M 14 45 C 15 59, 26 73, 45 74 C 64 73, 75 59, 76 45 C 72 53, 62 65, 45 65 C 28 65, 18 53, 14 45 Z"
            fill="#1a1a1a"
          />
        </g>

        {/* TYPOGRAPHY */}
        <g transform="translate(108, 0)">
          {/* "Milestone" - Deep Royal Purple */}
          <text
            x="0"
            y="44"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="900"
            fontSize="45"
            fill="#52247f"
            letterSpacing="-0.8"
          >
            Milestone
          </text>

          {/* "Domestic Services Ltd" - Forest Green */}
          <text
            x="1"
            y="67"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="20"
            fill="#235c27"
            letterSpacing="0.2"
          >
            Domestic Services Ltd
          </text>

          {/* "Professionalizing domestic work" - Dark Charcoal */}
          {showTagline && (
            <text
              x="2"
              y="82"
              fontFamily="Arial, Helvetica, sans-serif"
              fontWeight="700"
              fontSize="12.5"
              fill="#1a1a1a"
              letterSpacing="0.1"
            >
              Professionalizing domestic work
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};
