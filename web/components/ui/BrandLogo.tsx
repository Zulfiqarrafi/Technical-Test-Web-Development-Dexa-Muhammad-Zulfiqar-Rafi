import React from 'react';
import dexaRedLogo from '../../assets/dexa-group-red.png';
import dexaWhiteLogo from '../../assets/dexa-group-white.png';

interface BrandLogoProps {
  inverted?: boolean;
  height?: number;
  className?: string;
  subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  inverted = false,
  height = 24,
  className = '',
  subtitle,
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
      }}
      className={className}
    >
      <img
        src={inverted ? dexaWhiteLogo : dexaRedLogo}
        alt="Dexa Group Logo"
        style={{
          height: `${height}px`,
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
      />
      {subtitle && (
        <span
          style={{
            fontSize: '11px',
            color: inverted ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
            borderLeft: `1px solid ${
              inverted ? 'rgba(255,255,255,0.2)' : 'var(--border-default)'
            }`,
            paddingLeft: '8px',
            lineHeight: 1.2,
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
};

