import React from 'react';

interface LogoProps {
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            className={className}
            aria-label="Kronos Logo"
        >
            <defs>
                <style>
                    {`.heavy { fill: none; stroke: currentColor; stroke-width: 12; stroke-linecap: square; stroke-linejoin: miter; }
            .filled { fill: currentColor; stroke: none; }`}
                </style>
            </defs>

            {/* Outer Border */}
            <rect x="6" y="6" width="88" height="88" className="heavy" />

            {/* Stylized Hourglass / K Shape */}
            <path d="M25 25 L75 25 L50 50 L75 75 L25 75 L50 50 Z" className="filled" />

            {/* Center Dot (The Singularity/Present) */}
            <circle cx="50" cy="50" r="6" fill="white" />
        </svg>
    );
};

export default Logo;
