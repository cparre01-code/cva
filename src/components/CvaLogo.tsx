import React from 'react';

interface CvaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const CvaLogo: React.FC<CvaLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const sizeStyles = {
    sm: { height: 32, scale: 0.55 },
    md: { height: 44, scale: 0.75 },
    lg: { height: 56, scale: 0.95 },
    xl: { height: 72, scale: 1.2 },
  }[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 380 200"
        height={sizeStyles.height}
        className="w-auto max-w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CVA Cozinhas & Banhos"
      >
        {/* Letter C */}
        <path
          d="M115 48 C95 36, 68 36, 48 54 C26 73, 24 110, 45 132 C65 152, 98 152, 118 138 L118 116 C105 126, 82 128, 68 116 C53 103, 53 82, 68 68 C80 57, 102 57, 115 68 Z"
          fill="#3F4245"
        />

        {/* Letter V */}
        <path
          d="M125 40 L168 145 L198 145 L242 40 L212 40 L183 118 L155 40 Z"
          fill="#3F4245"
        />

        {/* Letter A - Left Stroke */}
        <path
          d="M208 145 L260 40 L288 40 L242 145 Z"
          fill="#3F4245"
        />

        {/* Letter A - Cyan Water Drop Element */}
        <path
          d="M272 80 C272 70, 288 64, 305 64 C309 76, 308 89, 298 97 C288 105, 276 102, 272 94 Z"
          fill="#47A6B3"
        />

        {/* Letter A - Right Lower Leg */}
        <path
          d="M290 145 L306 108 L328 108 L314 145 Z"
          fill="#3F4245"
        />

        {/* Subtitle: cozinhas & banhos */}
        {showSubtitle && (
          <text
            x="190"
            y="188"
            textAnchor="middle"
            fontFamily="Montserrat, 'Segoe UI', system-ui, -apple-system, sans-serif"
            fontSize="27"
            fontWeight="500"
            fill="#3F4245"
            letterSpacing="0.06em"
          >
            cozinhas &amp; banhos
          </text>
        )}
      </svg>
    </div>
  );
};
