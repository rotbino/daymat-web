// app/admin/feedbacks/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    MessageSquare, Loader2, ChevronDown, ChevronLeft, Send, Lightbulb, Bug, AlertTriangle,
    Filter, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackItem {
    id: string;
    content: string;
    type: string;
    status: string;
    createdAt: string;
    user: { id: string; fullName: string; avatarUrl: string | null };
    arm: { id: string; slug: string; name: string } | null;
    _count: { replies: number };
}

export default function AdminFeedbacksPage() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedArmSlug, setSelectedArmSlug] = useState<string>('');
    const [arms, setArms] = useState<{ slug: string; name: string }[]>([]);
    const [expandedReplies, setExpandedReplies] = useState<Record<string, any[]>>({});
    const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
    const [replyContent, setReplyContent] = useState<Record<string, string>>({});
    const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});
    const [filterType, setFilterType] = useState<string>('');
    // دریافت لیست بازوها برای فیلتر
    useEffect(() => {
        const fetchArms = async () => {
            try {
                const data = await apiService.admin.arms.getAll({ status: 'active' });
                setArms(data.items.map((a: any) => ({ slug: a.slug, name: a.name })));
            } catch (err) {
                console.error('Error fetching arms:', err);
            }
        };
        fetchArms();
    }, []);

    const fetchFeedbacks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiService.admin.feedbacks.getList({
                armSlug: selectedArmSlug || undefined,
                page,
                type: filterType || undefined,   // ← اضافه شود
            });
            setFeedbacks(data.items);
            setTotalPages(data.pagination.totalPages);
        } catch (err: any) {
            toast.error(err?.message || 'خطا در دریافت بازخوردها');
        } finally {
            setLoading(false);
        }
    }, [selectedArmSlug, page, filterType]);

    useEffect(() => {
        fetchFeedbacks();
    }, [fetchFeedbacks]);

    const toggleReplies = async (itemId: string) => {
        if (expandedReplies[itemId]) {
            setExpandedReplies(prev => ({ ...prev, [itemId]: undefined }));
            return;
        }
        setLoadingReplies(prev => ({ ...prev, [itemId]: true }));
        try {
            const replies = await apiService.admin.feedbacks.getReplies(itemId);
            setExpandedReplies(prev => ({ ...prev, [itemId]: replies }));
        } catch {
            toast.error('خطا در دریافت پاسخ‌ها');
        } finally {
            setLoadingReplies(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const handleReplySubmit = async (parentId: string) => {
        const content = replyContent[parentId];
        if (!content?.trim()) return;
        setSubmittingReply(prev => ({ ...prev, [parentId]: true }));
        try {
            await apiService.admin.feedbacks.reply(parentId, content);
            toast.success('پاسخ با موفقیت ثبت شد');
            setReplyContent(prev => ({ ...prev, [parentId]: '' }));
            // رفرش پاسخ‌ها
            const replies = await apiService.admin.feedbacks.getReplies(parentId);
            setExpandedReplies(prev => ({ ...prev, [parentId]: replies }));
        } catch (err: any) {
            toast.error(err?.message || 'خطا در ثبت پاسخ');
        } finally {
            setSubmittingReply(prev => ({ ...prev, [parentId]: false }));
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await apiService.admin.feedbacks.updateStatus(id, status);
            toast.success('وضعیت بروز شد');
            fetchFeedbacks();
        } catch (err: any) {
            toast.error(err?.message || 'خطا');
        }
    };

    const typeIcon = (type: string) => {
        switch (type) {
            case 'bug': return <Bug className="w-4 h-4 text-red-500" />;
            case 'critique': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default: return <Lightbulb className="w-4 h-4 text-green-500" />;
        }
    };

    const typeLabel = (type: string) => {
        switch (type) {
            case 'bug': return 'باگ';
            case 'critique': return 'انتقاد';
            default: return 'پیشنهاد';
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'open': return { icon: Clock, cls: 'bg-yellow-100 text-yellow-700', label: 'باز' };
            case 'under_review': return { icon: Clock, cls: 'bg-blue-100 text-blue-700', label: 'در بررسی' };
            case 'resolved': return { icon: CheckCircle, cls: 'bg-green-100 text-green-700', label: 'حل شده' };
            case 'closed': return { icon: XCircle, cls: 'bg-gray-100 text-gray-700', label: 'بسته' };
            default: return { icon: Clock, cls: 'bg-yellow-100 text-yellow-700', label: 'باز' };
        }
    };

    return (
        <div className="p-4 lg:p-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-xl font-bold text-on-surface">مدیریت بازخوردها</h1>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedArmSlug}
                        onChange={(e) => { setSelectedArmSlug(e.target.value); setPage(1); }}
                        className="h-9 px-3 border border-outline-variant bg-surface-container-lowest rounded-lg text-sm"
                    >
                        <option value="">همه بازارها</option>
                        {arms.map((arm) => (
                            <option key={arm.slug} value={arm.slug}>{arm.name}</option>
                        ))}
                    </select>

                    {/* فیلتر نوع پیام */}
                    <select
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                        className="h-9 px-3 border border-outline-variant bg-surface-container-lowest rounded-lg text-sm"
                    >
                        <option value="">همه انواع</option>
                        <option value="suggestion">پیشنهاد</option>
                        <option value="req">نیاز کسب و کار</option>
                        <option value="bug">باگ</option>
                        <option value="critique">انتقاد</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : feedbacks.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>هیچ بازخوردی ثبت نشده است.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedbacks.map((item) => {
                        const status = statusBadge(item.status);
                        const StatusIcon = status.icon;
                        return (
                            <div key={item.id} className="bg-white dark:bg-gray-900 border border-outline-variant/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                                        {item.user.fullName?.[0] || '؟'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-xs font-medium text-on-surface">{item.user.fullName}</span>
                                            <span className="text-[10px] text-on-surface-variant">{new Date(item.createdAt).toLocaleDateString('fa-IR')}</span>
                                            {item.arm && (
                                                <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded-full">{item.arm.name}</span>
                                            )}
                                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full",
                                                item.type === 'bug' ? "bg-red-50 text-red-600" :
                                                    item.type === 'critique' ? "bg-yellow-50 text-yellow-600" :
                                                        "bg-green-50 text-green-600"
                                            )}>
                                                {typeLabel(item.type)}
                                            </span>
                                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1", status.cls)}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{item.content}</p>

                                        {/* عملیات */}
                                        <div className="flex items-center gap-3 mt-3 text-xs flex-wrap">
                                            <button
                                                onClick={() => toggleReplies(item.id)}
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                {loadingReplies[item.id] ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : expandedReplies[item.id] ? (
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                ) : (
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                )}
                                                <span>{item._count.replies} پاسخ</span>
                                            </button>

                                            {/* تغییر وضعیت */}
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                className="h-7 text-[10px] border border-outline-variant bg-surface-container-lowest rounded px-1"
                                            >
                                                <option value="open">باز</option>
                                                <option value="under_review">در بررسی</option>
                                                <option value="resolved">حل شده</option>
                                                <option value="closed">بسته</option>
                                            </select>
                                        </div>

                                        {/* پاسخ‌ها */}
                                        {expandedReplies[item.id]?.length > 0 && (
                                            <div className="mt-3 mr-6 pr-4 border-r-2 border-outline-variant/30 space-y-2">
                                                {expandedReplies[item.id].map((reply: any) => (
                                                    <div key={reply.id}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-on-surface">{reply.user.fullName}</span>
                                                            <span className="text-[10px] text-on-surface-variant">{new Date(reply.createdAt).toLocaleDateString('fa-IR')}</span>
                                                        </div>
                                                        <p className="text-xs text-on-surface-variant">{reply.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* فرم پاسخ ادمین */}
                                        <div className="mt-3 flex items-start gap-2">
                                            <textarea
                                                value={replyContent[item.id] || ''}
                                                onChange={(e) => setReplyContent(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                placeholder="پاسخ شما..."
                                                rows={2}
                                                className="flex-1 border border-outline-variant bg-surface-container-lowest rounded-lg p-2 text-xs resize-none"
                                            />
                                            <button
                                                onClick={() => handleReplySubmit(item.id)}
                                                disabled={submittingReply[item.id] || !replyContent[item.id]?.trim()}
                                                className="h-8 px-3 bg-primary text-on-primary rounded-lg text-xs disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {submittingReply[item.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                                ارسال
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={cn("w-8 h-8 rounded-lg text-sm", page === i + 1 ? "bg-primary text-white" : "bg-surface-container-low")}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}