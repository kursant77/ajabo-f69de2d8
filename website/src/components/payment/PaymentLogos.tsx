import React from "react";

export const ClickLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 5.5h-7v21h7v-21z" fill="#00AEEF" />
        <path d="M26.5 5.5h-10v5h5v11h-5v5h10v-5h-5v-11h5v-5z" fill="#00AEEF" />
        <path d="M38.5 5.5h-5v21h10v-5h-5v-16z" fill="#00AEEF" />
        <path d="M54.5 5.5h-10v21h5v-5h5v-5h-5v-6h5v-5z" fill="#00AEEF" />
        <text x="0" y="24" fontStyle="italic" fontWeight="bold" fill="#004C99" fontSize="20" style={{ transform: 'translateX(5px)' }}>CLICK</text>
    </svg>
);

export const PaymeLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="32" rx="4" fill="#00BFA5" />
        <text x="50" y="21" textAnchor="middle" fontWeight="bold" fill="white" fontSize="16">Payme</text>
    </svg>
);

export const PaynetLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="32" rx="4" fill="#1A237E" />
        <text x="50" y="21" textAnchor="middle" fontWeight="bold" fill="white" fontSize="16">PAYNET</text>
    </svg>
);

export const UzumLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 5 L35 25 L50 5" stroke="#7C3AED" strokeWidth="4" fill="none" strokeLinecap="round" />
        <text x="55" y="21" fontWeight="bold" fill="#7C3AED" fontSize="16">Uzum</text>
    </svg>
);

export const CashLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="32" rx="4" fill="#10B981" />
        <text x="50" y="21" textAnchor="middle" fontWeight="bold" fill="white" fontSize="16">NAQD</text>
    </svg>
);
