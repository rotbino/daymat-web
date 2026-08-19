// app/public/FormHeader.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

interface FormHeaderProps {
    title: string;
    subtitle?: string;
    onBackClick?: () => void;
    backUrl?: string;
}

export function FormHeader({
                               title,
                               subtitle,
                               onBackClick,
                               backUrl
                           }: FormHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBackClick) {
            onBackClick();
        } else if (backUrl) {
            router.push(backUrl);
        } else {
            router.back();
        }
    };

    return (
        <header className="bg-surface w-full fixed top-0 left-0 right-0 z-50 border-b border-outline-variant flex justify-between items-center px-4 h-16">
            <div className="flex items-center gap-3">
                {/* دکمه بازگشت */}
                <button
                    onClick={handleBack}
                    className="flex items-center justify-center w-10 h-10 text-on-surface-variant hover:text-primary transition-colors active:scale-95"
                >
                    <ArrowRight className="w-6 h-6" />
                </button>

                {/* عنوان  */}
                <div className="flex flex-col text-right">
                    <span className="font-headline-sm  font-bold text-[12px] text-on-surface leading-tight">
                        {title}
                    </span>

                </div>
            </div>

            {/* لوگوی کوچک برند */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <span className="font-mono-data font-bold text-[10px] text-on-surface-variant tracking-widest uppercase">
                        DAYMAT
                    </span>

                </div>
            </div>
        </header>
    );
}