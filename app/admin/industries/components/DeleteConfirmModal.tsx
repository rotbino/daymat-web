// app/admin/industries/components/DeleteConfirmModal.tsx
'use client';

import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { IndustryNode } from '../page';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    industry: IndustryNode | null;
    loading: boolean;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, industry, loading }: DeleteConfirmModalProps) {
    if (!isOpen || !industry) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant">
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
                    <h3 className="text-lg font-semibold text-on-surface">تأیید حذف</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors">
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-error/5 border border-error/20 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-error">آیا از حذف این صنف اطمینان دارید؟</p>
                            <p className="text-sm text-on-surface mt-1 font-semibold">{industry.title}</p>
                            <p className="text-xs text-on-surface-variant/60 mt-2">این عملیات غیرقابل بازگشت است.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose}
                                className="flex-1 h-11 border border-outline text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium">انصراف</button>
                        <button onClick={onConfirm} disabled={loading}
                                className="flex-1 h-11 bg-error text-on-error rounded-xl hover:bg-error/90 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}حذف
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}