import React from "react";

export const ClickLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 120 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="clickGrad" x1="0" y1="0" x2="120" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0098EA" />
                <stop offset="1" stopColor="#006BB4" />
            </linearGradient>
        </defs>
        <rect width="120" height="36" rx="6" fill="url(#clickGrad)" />
        <text x="60" y="24" textAnchor="middle" fontWeight="800" fill="white" fontSize="18" fontFamily="Arial, sans-serif" letterSpacing="1">CLICK</text>
    </svg>
);

export const PaymeLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 120 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="paymeGrad" x1="0" y1="0" x2="120" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00CCAA" />
                <stop offset="1" stopColor="#009980" />
            </linearGradient>
        </defs>
        <rect width="120" height="36" rx="6" fill="url(#paymeGrad)" />
        <text x="60" y="24" textAnchor="middle" fontWeight="800" fill="white" fontSize="17" fontFamily="Arial, sans-serif" letterSpacing="0.5">Payme</text>
    </svg>
);

export const PaynetLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 120 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="paynetGrad" x1="0" y1="0" x2="120" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#283593" />
                <stop offset="1" stopColor="#1A237E" />
            </linearGradient>
        </defs>
        <rect width="120" height="36" rx="6" fill="url(#paynetGrad)" />
        <text x="60" y="24" textAnchor="middle" fontWeight="800" fill="white" fontSize="16" fontFamily="Arial, sans-serif" letterSpacing="1">PAYNET</text>
    </svg>
);

export const UzumLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 120 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="uzumGrad" x1="0" y1="0" x2="120" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#6D28D9" />
            </linearGradient>
        </defs>
        <rect width="120" height="36" rx="6" fill="url(#uzumGrad)" />
        <text x="60" y="24" textAnchor="middle" fontWeight="800" fill="white" fontSize="17" fontFamily="Arial, sans-serif" letterSpacing="0.5">Uzum</text>
    </svg>
);

export const CashLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 120 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="cashGrad" x1="0" y1="0" x2="120" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10B981" />
                <stop offset="1" stopColor="#059669" />
            </linearGradient>
        </defs>
        <rect width="120" height="36" rx="6" fill="url(#cashGrad)" />
        <text x="14" y="24" fontWeight="800" fill="white" fontSize="18" fontFamily="Arial, sans-serif">💵</text>
        <text x="72" y="24" textAnchor="middle" fontWeight="800" fill="white" fontSize="15" fontFamily="Arial, sans-serif" letterSpacing="0.5">NAQD</text>
    </svg>
);
