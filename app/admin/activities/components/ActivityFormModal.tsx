// app/admin/activities/components/ActivityFormModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ActivityNode } from '../page';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    activity: ActivityNode | null;
    loading: boolean;
}

export function ActivityFormModal({ isOpen, onClose, onSubmit, activity, loading }: Props) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [code, setCode] = useState('');
    const isEdit = !!activity;

    useEffect(() => {
        if (isOpen) {
            setTitle(activity?.title || '');
            setSlug(activity?.slug || '');
            setCode(activity?.code || '');
        }
    }, [isOpen]);

    const handleSlugFromTitle = (v: string) => { setTitle(v); if (!isEdit) setSlug(v.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '').toLowerCase()); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit({ title, slug, code: code || undefined }); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant">
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
                    <h3 className="text-lg font-semibold">{isEdit ? 'ویرایش' : 'افزودن فعالیت'}</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1.5">عنوان <span className="text-error">*</span></label>
                        <input type="text" value={title} onChange={e => handleSlugFromTitle(e.target.value)} required
                               className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1.5">اسلاگ <span className="text-error">*</span></label>
                        <input type="text" value={slug} onChange={e => setSlug(e.target.value)} required dir="ltr"
                               className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm font-mono text-left focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1.5">کد</label>
                        <input type="text" value={code} onChange={e => setCode(e.target.value)}
                               className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 h-11 border border-outline rounded-xl text-sm">انصراف</button>
                        <button type="submit" disabled={loading} className="flex-1 h-11 bg-primary text-on-primary rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}{isEdit ? 'ذخیره' : 'ایجاد'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}