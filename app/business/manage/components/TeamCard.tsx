// app/business/manage/components/TeamCard.tsx
// 👥 تیم کاری کسب‌وکار — افزودن/ویرایش/حذف اعضا + دو سطح نقش:
//     • نقش سیستمی: مدیر کسب‌وکار (admin) / عضو (member)
//     • نقش شرکتی: مالک، مدیرعامل، مدیر فروش، بازاریاب… (USER_POSITIONS)
//   اینکه چه کسی در کاتالوگ فروشنده/ویزیتور/ادمین شود، در کاتالوگ فروش مشخص می‌شود — اینجا فقط نقش در کسب‌وکار.
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import {
    Users, UserPlus, Pencil, Trash2, Loader2, User, ShieldCheck, X, Check, AlertTriangle, Search, Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { USER_POSITIONS } from '@/lib/api/data-types';
import type { BusinessTeamMember } from '@/lib/api/apiTypes';
import { useAddBusinessMember, useUpdateBusinessMember, useRemoveBusinessMember, useTeamUserSearch } from '@/lib/api/apiHooks';
import { resolveFileSrc } from './BusinessLogo';

// ✅ کاربرِ نتیجهٔ جستجو برای افزودن به تیم
type TeamUserItem = { id: string; fullName: string | null; phone: string; avatarUrl: string | null };

/**
 * دعوت به ثبت‌نام در دیمت — شیت اشتراک‌گذاری سیستم (موبایل)
 * اگر شیت نبود (دسکتاپ) یا خطا داد، لینک کپی می‌شود
 */
const inviteToDaymat = async () => {
    const link = `${window.location.origin}/login`;
    const copyFallback = async () => {
        const ok = () => toast.success('لینک ثبت‌نام کپی شد — بفرستش برایش تا در دیمت ثبت‌نام کنه');
        try {
            await navigator.clipboard.writeText(link);
            ok();
        } catch {
            try {
                const ta = document.createElement('textarea');
                ta.value = link;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                ok();
            } catch {
                toast.error('کپی خودکار نشد — این لینک را دستی برایش بفرست: ' + link);
            }
        }
    };
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            await navigator.share({
                title: 'دعوت به ثبت‌نام در دیمت',
                text: 'بیا به دیمت بپیوند — بازار عمده و خردهٔ آنلاین. ثبت‌نام از این لینک:',
                url: link,
            });
            return; // اشتراک موفق
        }
    } catch (err: any) {
        if (err?.name === 'AbortError') return; // کاربر شیت را بست — کاری نکن
    }
    await copyFallback();
};

// ✅ مقدار «سایر» از خودِ لیست — هم‌راستا با data-types
const POSITION_OTHER_VALUE = USER_POSITIONS.find((p) => p.label === 'سایر')?.value ?? '8';

/* ─── انتخاب نقش شرکتی — چیپ‌های مشترک افزودن/ویرایش ─── */
function PositionChips({ value, other, onChange, onOtherChange }: {
    value: string;
    other: string;
    onChange: (v: string) => void;
    onOtherChange: (v: string) => void;
}) {
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
                {USER_POSITIONS.map((p) => (
                    <button key={p.value} type="button" onClick={() => onChange(p.value)}
                            className={cn(
                                'px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors',
                                value === p.value
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-outline-variant/40 dark:border-gray-700 text-on-surface-variant hover:border-primary/40',
                            )}>
                        {p.label}
                    </button>
                ))}
            </div>
            {value === POSITION_OTHER_VALUE && (
                <input type="text" value={other} maxLength={60} autoFocus
                       onChange={(e) => onOtherChange(e.target.value)}
                       placeholder="نقش در شرکت چیه؟ مثلا: مدیر فروش شعبه مرکزی"
                       className="w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border
                           border-outline-variant/40 dark:border-gray-700
                           focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            )}
        </div>
    );
}

const positionToText = (role: string, other: string) =>
    role ? (role === POSITION_OTHER_VALUE ? other.trim() : (USER_POSITIONS.find((p) => p.value === role)?.label || '')) : '';

/* ─── ردیف عضو ─── */
function MemberRow({ member, canRemove, onEdit, onRemove, removing }: {
    member: BusinessTeamMember;
    canRemove: boolean;
    onEdit: () => void;
    onRemove: () => void;
    removing: boolean;
}) {
    const isAdmin = member.role === 'admin' || member.isCreator;
    return (
        <div className="flex items-center gap-2.5 py-2.5">
            <span className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-high dark:bg-gray-800 grid place-items-center flex-shrink-0">
                {member.user?.avatarUrl ? (
                    <Image src={resolveFileSrc(member.user.avatarUrl)!} alt={member.user?.fullName || ''}
                           width={36} height={36} className="w-full h-full object-cover" unoptimized />
                ) : (
                    <User className="w-4 h-4 text-on-surface-variant/50" />
                )}
            </span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[12px] font-bold text-on-surface truncate">
                        {member.user?.fullName || 'کاربر دیمت'}
                    </p>
                    {member.isCreator && (
                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-1.5 py-0.5">سازنده</span>
                    )}
                    {isAdmin && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> مدیر
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-on-surface-variant/70 mt-0.5 truncate">
                    {member.position || 'نقش شرکتی مشخص نشده'}
                </p>
            </div>
            <button type="button" onClick={onEdit} aria-label="ویرایش نقش عضو"
                    className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all flex-shrink-0">
                <Pencil className="w-3.5 h-3.5" />
            </button>
            {canRemove && (
                <button type="button" onClick={onRemove} disabled={removing} aria-label="حذف از تیم"
                        className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-error hover:bg-error/10 active:scale-90 transition-all flex-shrink-0 disabled:opacity-40">
                    {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
            )}
        </div>
    );
}

/* ─── قاب مودال مشترک ─── */
function TeamModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);
    return createPortal(
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
             onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl
                     max-h-[90dvh] flex flex-col overflow-hidden
                     animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <h3 className="text-sm font-extrabold text-on-surface">{title}</h3>
                    <button onClick={onClose} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4">{children}</div>
            </div>
        </div>,
        document.body,
    );
}

/* ═══════════ کارت اصلی ═══════════ */
export function TeamCard({
    businessId,
    members,
    responsibleUserId,
    currentUserId,
    autoOpenAdd,
    onAutoOpened,
}: {
    businessId: string;
    members: BusinessTeamMember[];
    responsibleUserId?: string | null; // سازنده/مالک — حذف و سلب مدیریتش معنا ندارد
    currentUserId?: string | null;     // خود کاربر — حذف خودش از اینجا ممکن نیست
    autoOpenAdd?: boolean;             // سیگنال از دکمهٔ «+ تیم کاری» بالای صفحه — مودال افزودن خودکار باز شود
    onAutoOpened?: () => void;         // بعد از مصرف سیگنال صدا زده می‌شود (ریست)
}) {
    const addMut = useAddBusinessMember();
    const updateMut = useUpdateBusinessMember();
    const removeMut = useRemoveBusinessMember();

    const [addOpen, setAddOpen] = useState(false);
    const [editMember, setEditMember] = useState<BusinessTeamMember | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<BusinessTeamMember | null>(null);

    // ─── فرم افزودن — جستجوی کاربر (اسم یا شماره) + انتخاب + نقش ───
    const [addQuery, setAddQuery] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [selectedUser, setSelectedUser] = useState<TeamUserItem | null>(null);
    const [addRole, setAddRole] = useState('');
    const [addOther, setAddOther] = useState('');

    // ─── فرم ویرایش ───
    const [editRole, setEditRole] = useState('');
    const [editOther, setEditOther] = useState('');

    // دیبانس جستجو (۴۰۰ms)
    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedQ(addQuery.trim()), 400);
        return () => window.clearTimeout(t);
    }, [addQuery]);

    // جستجوی کاربران ثبت‌نام‌شدهٔ دیمت — فقط تا وقتی عضوی انتخاب نشده
    const userSearchQ = useTeamUserSearch(debouncedQ, addOpen && !selectedUser);

    const openAdd = () => {
        setAddQuery(''); setDebouncedQ(''); setSelectedUser(null);
        setAddRole(''); setAddOther('');
        setAddOpen(true);
    };
    const openEdit = (m: BusinessTeamMember) => {
        const pos = (m.position || '').trim();
        const matched = USER_POSITIONS.find((p) => p.label === pos);
        setEditRole(pos ? (matched?.value || POSITION_OTHER_VALUE) : '');
        setEditOther(pos && !matched ? pos : '');
        setEditMember(m);
    };

    // ─── سیگنال «+ تیم کاری» از کارت هویت بالای صفحه — مودال افزودن را خودکار باز کن ───
    useEffect(() => {
        if (!autoOpenAdd) return;
        openAdd();
        onAutoOpened?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoOpenAdd]);

    const handleAdd = async () => {
        if (!selectedUser) {
            toast.error('اول همکارت را از جستجو پیدا و انتخاب کن');
            return;
        }
        const position = positionToText(addRole, addOther);
        if (addRole === POSITION_OTHER_VALUE && !position) {
            toast.error('نقش همکار را بنویس');
            return;
        }
        if (!addRole) {
            toast.error('نقش همکار در کسب‌وکار را انتخاب کن');
            return;
        }
        try {
            await addMut.mutateAsync({ id: businessId, data: { userId: selectedUser.id, position } });
            setSelectedUser(null);
            setAddOpen(false);
        } catch { /* توست در هوک */ }
    };

    const handleEditSave = async () => {
        if (!editMember) return;
        const position = positionToText(editRole, editOther);
        if (editRole === POSITION_OTHER_VALUE && !position) {
            toast.error('نقش را بنویس');
            return;
        }
        try {
            await updateMut.mutateAsync({ id: businessId, memberId: editMember.id, data: { position } });
            toast.success('نقش عضو به‌روزرسانی شد');
            setEditMember(null);
        } catch { /* توست در هوک */ }
    };

    const handleToggleAdmin = async (m: BusinessTeamMember) => {
        const next = m.role === 'admin' ? 'member' : 'admin';
        if (next === 'member' && m.userId === responsibleUserId) return; // سازنده همیشه مدیر است
        try {
            await updateMut.mutateAsync({
                id: businessId,
                memberId: m.id,
                data: { role: next },
            });
            toast.success(next === 'admin'
                ? 'مدیریت کسب‌وکار به این عضو واگذار شد'
                : 'مدیریت از این عضو گرفته شد');
        } catch { /* توست در هوک */ }
    };

    const handleRemove = async (m: BusinessTeamMember) => {
        try {
            await removeMut.mutateAsync({ id: businessId, memberId: m.id });
            setConfirmRemove(null);
        } catch { /* توست در هوک */ }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 sm:p-5">
            <div className="flex items-center gap-2.5 mb-1">
                <span className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-extrabold text-on-surface">تیم کاری کسب‌وکار</p>
                    <p className="text-[10px] text-on-surface-variant/70">
                        نقشِ اعضا در کسب‌وکار — اینکه چه کسی در کاتالوگ فروشنده یا ویزیتور شود، در کاتالوگ مشخص می‌شود
                    </p>
                </div>
                <button type="button" onClick={openAdd}
                        className="h-9 px-3 rounded-xl bg-primary/10 text-primary text-[11px] font-extrabold flex items-center gap-1.5 hover:bg-primary/15 active:scale-95 transition-all flex-shrink-0">
                    <UserPlus className="w-3.5 h-3.5" /> افزودن عضو
                </button>
            </div>

            {members.length === 0 ? (
                <p className="text-[12px] text-on-surface-variant/40 leading-5 py-3">
                    هنوز عضوی نداری — همکارانت را با شماره موبایل به تیم اضافه کن و نقششان را مشخص کن.
                </p>
            ) : (
                <div className="divide-y divide-outline-variant/20 dark:divide-gray-700/60 mt-1">
                    {members.map((m0) => {
                        // ✅ پرچم سازنده — از responsibleUserId (findOne قدیمی isCreator ندارد)
                        const m: BusinessTeamMember = { ...m0, isCreator: m0.userId === responsibleUserId };
                        const isSelf = m.userId === currentUserId;
                        const isResponsible = m.isCreator;
                        if (confirmRemove?.id === m.id) {
                            return (
                                <div key={m.id} className="py-2.5 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />
                                    <p className="flex-1 text-[11px] font-bold text-on-surface">
                                        «{m.user?.fullName || 'این کاربر'}» از تیم حذف شود؟
                                    </p>
                                    <button type="button" onClick={() => handleRemove(m)} disabled={removeMut.isPending}
                                            className="h-8 px-3 rounded-lg bg-error text-white text-[11px] font-extrabold flex items-center gap-1 disabled:opacity-50">
                                        {removeMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'حذف'}
                                    </button>
                                    <button type="button" onClick={() => setConfirmRemove(null)}
                                            className="h-8 px-3 rounded-lg border border-outline-variant/40 text-[11px] font-bold text-on-surface-variant">
                                        انصراف
                                    </button>
                                </div>
                            );
                        }
                        return (
                            <MemberRow
                                key={m.id}
                                member={m}
                                canRemove={!isSelf && !isResponsible}
                                removing={removeMut.isPending && removeMut.variables?.memberId === m.id}
                                onEdit={() => openEdit(m)}
                                onRemove={() => setConfirmRemove(m)}
                            />
                        );
                    })}
                </div>
            )}

            {/* ─── مودال افزودن عضو — جستجو با اسم یا شماره ─── */}
            {addOpen && (
                <TeamModal title="افزودن عضو به تیم" onClose={() => setAddOpen(false)}>
                    <div className="space-y-4">
                        {/* مرحلهٔ ۱ — جستجو یا کاربرِ انتخاب‌شده */}
                        {!selectedUser ? (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-on-surface block">
                                    جستجوی همکار در دیمت <span className="text-primary">*</span>
                                </label>
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                                    <input type="text" value={addQuery}
                                           onChange={(e) => setAddQuery(e.target.value)}
                                           placeholder="اسم یا شماره موبایل… مثلاً: علی یا 09123456789"
                                           className="w-full h-11 pr-9 pl-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border
                                               border-outline-variant/40 dark:border-gray-700
                                               focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                                </div>
                                <p className="text-[10px] text-on-surface-variant/60 leading-4">
                                    همکارت باید اول در دیمت ثبت‌نام کرده باشد.
                                </p>

                                {/* نتایج جستجو */}
                                {addQuery.trim().length >= 3 && (
                                    <div className="pt-1 space-y-1.5">
                                        {userSearchQ.isFetching ? (
                                            <div className="flex items-center justify-center gap-2 py-4 text-[11px] text-on-surface-variant/60">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> در حال جستجو…
                                            </div>
                                        ) : (userSearchQ.data?.items?.length ?? 0) > 0 ? (
                                            <>
                                                <p className="text-[10px] font-bold text-on-surface-variant/70 px-1">
                                                    روی همکارت بزن تا انتخاب بشه:
                                                </p>
                                                {userSearchQ.data!.items.map((u) => (
                                                    <button key={u.id} type="button"
                                                            onClick={() => { setSelectedUser(u); setAddQuery(''); }}
                                                            className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-outline-variant/40 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99] transition-all text-right">
                                                        <span className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-high dark:bg-gray-800 grid place-items-center flex-shrink-0">
                                                            {u.avatarUrl ? (
                                                                <Image src={resolveFileSrc(u.avatarUrl)!} alt={u.fullName || ''}
                                                                       width={36} height={36} className="w-full h-full object-cover" unoptimized />
                                                            ) : (
                                                                <User className="w-4 h-4 text-on-surface-variant/50" />
                                                            )}
                                                        </span>
                                                        <span className="flex-1 min-w-0">
                                                            <span className="block text-[12px] font-bold text-on-surface truncate">
                                                                {u.fullName || 'کاربر دیمت'}
                                                            </span>
                                                            <span className="block text-[10px] text-on-surface-variant/70 text-left" dir="ltr">
                                                                {u.phone}
                                                            </span>
                                                        </span>
                                                        <UserPlus className="w-4 h-4 text-primary flex-shrink-0" />
                                                    </button>
                                                ))}
                                            </>
                                        ) : debouncedQ ? (
                                            /* پیدا نشد — دعوت به ثبت‌نام در دیمت (شیت اشتراک‌گذاری) */
                                            <div className="rounded-xl border border-amber-300/60 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-500/5 p-3 space-y-2">
                                                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-5">
                                                    همکارت ظاهراً در دیمت ثبت‌نام نکرده. دعوت کن که در دیمت ثبت‌نام کنه.
                                                </p>
                                                <button type="button" onClick={inviteToDaymat}
                                                        className="w-full h-10 rounded-xl bg-amber-500 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 hover:bg-amber-500/90 active:scale-95 transition-all">
                                                    <Share2 className="w-3.5 h-3.5" /> دعوت به ثبت‌نام در دیمت
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* کاربر انتخاب‌شده — با امکان تغییر */
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-primary/40 bg-primary/5">
                                <span className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high dark:bg-gray-800 grid place-items-center flex-shrink-0">
                                    {selectedUser.avatarUrl ? (
                                        <Image src={resolveFileSrc(selectedUser.avatarUrl)!} alt={selectedUser.fullName || ''}
                                               width={40} height={40} className="w-full h-full object-cover" unoptimized />
                                    ) : (
                                        <User className="w-5 h-5 text-on-surface-variant/50" />
                                    )}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-on-surface truncate">
                                        {selectedUser.fullName || 'کاربر دیمت'}
                                    </p>
                                    <p className="text-[10px] text-on-surface-variant/70 text-left" dir="ltr">
                                        {selectedUser.phone}
                                    </p>
                                </div>
                                <button type="button" onClick={() => setSelectedUser(null)} aria-label="تغییر انتخاب"
                                        className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-error hover:bg-error/10 active:scale-90 transition-all flex-shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* مرحلهٔ ۲ — نقش در کسب‌وکار */}
                        {selectedUser && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-on-surface block">
                                    نقش در کسب‌وکار <span className="text-primary">*</span>
                                </label>
                                <PositionChips value={addRole} other={addOther}
                                               onChange={setAddRole} onOtherChange={setAddOther} />
                            </div>
                        )}

                        <button type="button" onClick={handleAdd} disabled={!selectedUser || addMut.isPending}
                                className="w-full h-11 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2
                                    bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-all">
                            {addMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            افزودن به تیم
                        </button>
                    </div>
                </TeamModal>
            )}

            {/* ─── مودال ویرایش عضو ─── */}
            {editMember && (
                <TeamModal title={`نقش «${editMember.user?.fullName || 'عضو'}»`} onClose={() => setEditMember(null)}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-on-surface block">نقش در کسب‌وکار</label>
                            <PositionChips value={editRole} other={editOther}
                                           onChange={setEditRole} onOtherChange={setEditOther} />
                        </div>

                        {/* نقش سیستمی — فقط برای غیرِسازنده (سازنده همیشه مدیر است) */}
                        {editMember.userId !== responsibleUserId && (
                            <button type="button" onClick={() => handleToggleAdmin(editMember)} disabled={updateMut.isPending}
                                    className={cn(
                                        'w-full rounded-xl border p-3.5 text-right transition-all disabled:opacity-50',
                                        editMember.role === 'admin'
                                            ? 'border-primary/40 bg-primary/5'
                                            : 'border-outline-variant/40 dark:border-gray-700',
                                    )}>
                                <span className="flex items-center gap-2">
                                    <ShieldCheck className={cn('w-4 h-4 flex-shrink-0',
                                        editMember.role === 'admin' ? 'text-primary' : 'text-on-surface-variant/50')} />
                                    <span className={cn('text-xs font-extrabold flex-1',
                                        editMember.role === 'admin' ? 'text-primary' : 'text-on-surface')}>
                                        {editMember.role === 'admin' ? 'مدیر کسب‌وکار' : 'عضو معمولی — واگذاری مدیریت'}
                                    </span>
                                    {updateMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-on-surface-variant" />}
                                </span>
                                <span className="block text-[10px] text-on-surface-variant/70 mt-1 leading-4">
                                    {editMember.role === 'admin'
                                        ? 'این عضو دسترسی مدیریت تیم دارد — برای گرفتن دسترسی، بزن'
                                        : 'با زدن، دسترسی مدیریت تیم به این عضو واگذار می‌شود'}
                                </span>
                            </button>
                        )}

                        <button type="button" onClick={handleEditSave} disabled={updateMut.isPending}
                                className="w-full h-11 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2
                                    bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-all">
                            {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            ذخیره نقش
                        </button>
                    </div>
                </TeamModal>
            )}
        </div>
    );
}
