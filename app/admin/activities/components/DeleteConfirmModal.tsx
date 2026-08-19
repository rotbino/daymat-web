// app/admin/activities/components/DeleteConfirmModal.tsx
'use client';
import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { ActivityNode } from '../page';

interface Props {
    isOpen: boolean; onClose: () => void; onConfirm: () => void;
    activity: ActivityNode | null; loading: boolean;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, activity, loading }: Props) {
    if (!isOpen || !activity) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h3 className="text-lg font-semibold">تأیید حذف</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-error/5 border border-error/20 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                        <p className="text-sm">حذف <span className="font-semibold">«{activity.title}»</span>؟</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 h-11 border border-outline rounded-xl text-sm">انصراف</button>
                        <button onClick={onConfirm} disabled={loading} className="flex-1 h-11 bg-error text-on-error rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}حذف
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}