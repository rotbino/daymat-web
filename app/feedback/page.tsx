'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { AppHeader, AppFooter } from '@/app/components';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { MessageSquare, Bug, Lightbulb, AlertTriangle, ChevronDown, ChevronLeft, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackItem {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    user: { id: string; fullName: string; avatarUrl: string | null };
    _count: { replies: number };
    replies?: FeedbackItem[];
}

export default function FeedbackPage() {
    const router = useRouter();
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedReplies, setExpandedReplies] = useState<Record<string, FeedbackItem[]>>({});
    const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

    // New feedback form
    const [showForm, setShowForm] = useState(false);
    const [formContent, setFormContent] = useState('');
    const [formType, setFormType] = useState('req');
    const [parentId, setParentId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchItems = useCallback(async () => {

        if (!currentSlug) return;
        setLoading(true);
        try {
            const data = await apiService.feedback.getList(currentSlug, page);
            setItems(data.items);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            toast.error('خطا در دریافت بازخوردها');
        } finally {
            setLoading(false);
        }
    }, [currentSlug, page]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const toggleReplies = async (itemId: string) => {
        if (expandedReplies[itemId]) {
            setExpandedReplies(prev => ({ ...prev, [itemId]: undefined }));
            return;
        }
        setLoadingReplies(prev => ({ ...prev, [itemId]: true }));
        try {
            const replies = await apiService.feedback.getReplies(itemId);
            setExpandedReplies(prev => ({ ...prev, [itemId]: replies }));
        } catch {
            toast.error('خطا در دریافت پاسخ‌ها');
        } finally {
            setLoadingReplies(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formContent.trim()) return;
        setSubmitting(true);
        try {
            await apiService.feedback.create({
                armSlug: currentSlug,
                content: formContent,
                type: formType,
                parentId: parentId || undefined,
            });
            toast.success(parentId ? 'پاسخ شما ثبت شد' : 'بازخورد شما ثبت شد');
            setFormContent('');
            setParentId(null);
            setShowForm(false);
            fetchItems();
            if (parentId) toggleReplies(parentId); // رفرش پاسخ‌ها
        } catch (err: any) {
            toast.error(err?.message || 'خطا');
        } finally {
            setSubmitting(false);
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
            case 'req': return 'نیاز کسب و کار';
            default: return 'پیشنهاد';
            case 'critique': return 'انتقاد';
            case 'bug': return 'باگ';

        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-surface dark:bg-gray-950">
            <AppHeader showBack={true} />
            <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
                {/* باکس هدف */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
                    <div className="hidden lg:flex p-2 bg-primary/10 rounded-full flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-on-surface dark:text-gray-100 mb-1">
                           به ما کمک کنید پلتفرم را بر اساس نیازهای واقعی شما بسازیم.
                        </h2>
                        <p className="text-xs text-on-surface-variant dark:text-gray-400 leading-relaxed">
                           چه امکانی نیاز شمارا برطرف می کند؟ چه امکانی باعث افزایش فروش و درآمد شما می شود؟ چه امکانی می خواهید که در آپ وجود ندارد. پیشنهاد از شما پیاده سازی با ما . همچنین می توانید پیشنهاد، انتقاد یا مشکلات سیستم را ارسال کنید تا تا اولین فرصت رسیدگی شود.
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-sm font-bold text-on-surface dark:text-gray-100">ثبت نیاز</h1>
                    {isAuthenticated && (
                        <button
                            onClick={() => { setShowForm(!showForm); setParentId(null); }}
                            className="h-9 px-4 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            {showForm ? 'بستن' : 'ثبت مورد جدید'}
                        </button>
                    )}
                </div>

                {/* فرم ثبت جدید */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-outline-variant/20 dark:border-gray-800 rounded-xl p-4 mb-6 space-y-3">
                        <div className="flex gap-3">
                            <select
                                value={formType}
                                onChange={(e) => setFormType(e.target.value)}
                                className="h-9 px-3 border border-outline-variant dark:border-gray-700 bg-surface-container-lowest dark:bg-gray-800 text-on-surface dark:text-gray-200 rounded-lg text-sm"
                            >
                                <option value="req">نیاز کسب و کار من</option>
                                <option value="suggestion">پیشنهاد</option>
                                <option value="critique">انتقاد</option>
                                <option value="bug">گزارش خطای سیستم</option>

                            </select>
                            {parentId && (
                                <span className="text-xs text-on-surface-variant dark:text-gray-400 self-center">در پاسخ به نظر انتخاب‌شده</span>
                            )}
                        </div>
                        <textarea
                            value={formContent}
                            onChange={(e) => setFormContent(e.target.value)}
                            placeholder="توضیحات خود را بنویسید..."
                            className="w-full min-h-40 bg-surface-container-lowest dark:bg-gray-800 border border-outline-variant dark:border-gray-700 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex justify-end gap-2">
                            {parentId && (
                                <button type="button" onClick={() => setParentId(null)} className="h-9 px-4 border border-outline-variant dark:border-gray-700 rounded-lg text-sm">لغو پاسخ</button>
                            )}
                            <button type="submit" disabled={submitting || !formContent.trim()} className="h-9 px-5 bg-primary text-on-primary rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                ارسال
                            </button>
                        </div>
                    </form>
                )}

                {/* لیست بازخوردها */}
                {items.length &&(
                    <p className={"p-2"}>موارد ثبت شده.</p>
                )}

                {loading ? (
                    <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
                ) : items.length === 0 ? (
                    <div className="text-center py-16 text-on-surface-variant dark:text-gray-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>هنوز بازخوردی ثبت نشده است.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-gray-900 border border-outline-variant/20 dark:border-gray-800 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                                        {item.user.fullName?.[0] || '؟'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-on-surface dark:text-gray-200">{item.user.fullName}</span>
                                            <span className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">{new Date(item.createdAt).toLocaleDateString('fa-IR')}</span>
                                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full",
                                                item.type === 'bug' ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                                                    item.type === 'critique' ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" :
                                                        "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                            )}>
                        {typeLabel(item.type)}
                      </span>
                                        </div>
                                        <p className="text-sm text-on-surface dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                                        <div className="flex items-center gap-3 mt-3 text-xs">
                                            <button
                                                onClick={() => { setParentId(item.id); setShowForm(true); }}
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" /> پاسخ
                                            </button>
                                            {item._count.replies > 0 && (
                                                <button
                                                    onClick={() => toggleReplies(item.id)}
                                                    className="text-on-surface-variant dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
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
                                            )}
                                        </div>

                                        {/* نمایش پاسخ‌ها */}
                                        {expandedReplies[item.id]?.map((reply) => (
                                            <div key={reply.id} className="mt-3 mr-6 pr-4 border-r-2 border-outline-variant/30 dark:border-gray-700 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-on-surface dark:text-gray-200">{reply.user.fullName}</span>
                                                    <span className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">{new Date(reply.createdAt).toLocaleDateString('fa-IR')}</span>
                                                </div>
                                                <p className="text-xs text-on-surface-variant dark:text-gray-400">{reply.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 pt-4">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        className={cn("w-8 h-8 rounded-lg text-sm", page === i + 1 ? "bg-primary text-white" : "bg-surface-container-low dark:bg-gray-800")}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

        </div>
    );
}