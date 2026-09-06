// app/components/LoginModal.tsx
'use client';

import { AuthForm } from './AuthForm';
import { X } from 'lucide-react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    armSlug?: string;
}

export function LoginModal({ isOpen, onClose, onSuccess, armSlug }: LoginModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6">
                <button onClick={onClose} className="absolute top-4 left-4 text-gray-400">
                    <X className="w-5 h-5" />
                </button>
                <AuthForm onSuccess={onSuccess} armSlug={armSlug} />
            </div>
        </div>
    );
}