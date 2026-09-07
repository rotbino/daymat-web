// app/admin/industries/components/IndustryFormModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { IndustryNode } from '../page';

interface IndustryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    industry: IndustryNode | null;
    loading: boolean;
}

export function IndustryFormModal({ isOpen, onClose, onSubmit, industry, loading }: IndustryFormModalProps) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [icon, setIcon] = useState('🏭');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    const isEdit = !!industry;

    useEffect(() => {
        if (isOpen) {
            if (industry) {
                setTitle(industry.title || '');
                setSlug(industry.slug || '');
                setIcon(industry.icon || '🏭');
                setCode(industry.code || '');
                setDescription(industry.description || '');
            } else {
                setTitle('');
                setSlug('');
                setIcon('🏭');
                setCode('');
                setDescription('');
            }
        }
    }, [isOpen, industry]);

    const handleSlugFromTitle = (value: string) => {
        setTitle(value);
        if (!isEdit) {
            setSlug(value.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '').toLowerCase());
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ title, slug, icon, code: code || undefined, description: description || undefined });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant">
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
                    <h3 className="text-lg font-semibold text-on-surface">
                        {isEdit ? 'ویرایش صنف' : 'افزودن صنف جدید'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors">
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-on-surface block mb-1.5">عنوان <span className="text-error">*</span></label>
                        <input type="text" value={title} onChange={e => handleSlugFromTitle(e.target.value)}
                               placeholder="مثال: تولیدکننده سیمان" required
                               className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-on-surface block mb-1.5">شناسه یکتا <span className="text-error">*</span></label>
                        <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                               placeholder="tolidkonande-seman" required dir="ltr"
                               className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm font-mono text-left focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-on-surface block mb-1.5">آیکون</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{icon}</span>
                                <input type="text" value={icon} onChange={e => setIcon(e.target.value)}
                                       className="flex-1 bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-on-surface block mb-1.5">کد صنف</label>
                            <input type="text" value={code} onChange={e => setCode(e.target.value)}
                                   placeholder="اختیاری"
                                   className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-on-surface block mb-1.5">توضیحات</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                                  className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                                className="flex-1 h-11 border border-outline text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium">انصراف</button>
                        <button type="submit" disabled={loading}
                                className="flex-1 h-11 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEdit ? 'ذخیره' : 'ایجاد'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}