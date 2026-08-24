// app/arm-admin/members/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    Users,
    Search,
    Filter,
    X,
    User,
    Building2,
    Phone,
    MapPin,
    BadgeCheck,
    Clock,
    Shield,
    ChevronDown,
    ChevronUp,
    Eye,
    Calendar,
    MoreVertical,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    Crown,
    Store,
    ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
// ============================================================
// تایپ‌ها
// ============================================================
interface Member {
    id: string;
    userId: string;
    user: {
        id: string;
        fullName: string | null;
        phone: string;
        avatarUrl?: string;
        isPhoneVerified: boolean;
    };
    businessId: string | null;
    business: {
        id: string;
        name: string;
        type: string;
        verificationTier: string;
        city: string;
        province: string;
        trustScore: number;
    } | null;
    role: 'viewer' | 'seller' | 'buyer' | 'system_admin';
    roleType?: 'seller' | 'buyer' | null;
    status: 'active' | 'pending' | 'paused' | 'banned';
    joinedAt: string;
    metadata?: any;
}

type SortField = 'joinedAt' | 'user.fullName' | 'user.phone' | 'role' | 'status';
type SortOrder = 'asc' | 'desc';
type RoleFilter = 'all' | 'system_admin' | 'seller' | 'buyer' | 'viewer';
type StatusFilter = 'all' | 'active' | 'pending' | 'paused' | 'banned';

export default function ArmAdminMembers() {
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const searchParams = useSearchParams();
    const initialStatus = (searchParams.get('status') as StatusFilter) || 'all';
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    //const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortField, setSortField] = useState<SortField>('joinedAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
    // ============================================================
    // پیجینگ
    // ============================================================
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 20;

    // ============================================================
    // ✅ واکشی اعضا از بک‌اند
    // ============================================================
    const fetchMembers = async () => {
        if (!currentSlug) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const sortByMap: Record<string, string> = {
                'user.fullName': 'name',
                'user.phone': 'phone',
                'role': 'role',
                'status': 'status',
                'joinedAt': 'joinedAt',
            };

            const data = await apiService.armAdmin.members.getList(currentSlug, {
                page,
                limit,
                search: searchQuery || undefined,
                role: roleFilter === 'all' ? undefined : roleFilter,
                status: statusFilter === 'all' ? undefined : statusFilter,
                sortBy: sortByMap[sortField] || 'joinedAt',
                sortOrder,
            });

            setMembers(data.items);
            setTotalPages(data.pagination.totalPages);
            setTotalItems(data.pagination.total);
        } catch (error: any) {
            console.error('Error fetching members:', error);
            toast.error(error?.message || 'خطا در دریافت لیست اعضا');
        } finally {
            setLoading(false);
        }
    };

    // ✅ واکشی با تغییر صفحه یا فیلترها
    useEffect(() => {
        fetchMembers();
    }, [currentSlug, page, searchQuery, roleFilter, statusFilter, sortField, sortOrder]);

    // ✅ ریست صفحه وقتی فیلترها تغییر میکنن
    useEffect(() => {
        setPage(1);
    }, [searchQuery, roleFilter, statusFilter]);

    useEffect(() => {
        const paramStatus = searchParams.get('status') as StatusFilter;
        if (paramStatus) {
            setStatusFilter(paramStatus);
        }
    }, [searchParams]);

    // ============================================================
    // ✅ آمار
    // ============================================================
    const stats = useMemo(() => {
        const total = members.length;
        const active = members.filter(m => m.status === 'active').length;
        const admins = members.filter(m => m.role === 'system_admin').length;
        const sellers = members.filter(m => m.role === 'seller').length;
        const buyers = members.filter(m => m.role === 'buyer').length;
        return { total, active, admins, sellers, buyers };
    }, [members]);

    // ============================================================
    // ✅ رندر وضعیت
    // ============================================================
    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-500/10 text-green-600 border-green-200',
            pending: 'bg-amber-500/10 text-amber-600 border-amber-200', // ✅
            paused: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
            banned: 'bg-red-500/10 text-red-600 border-red-200',
            rejected: 'bg-red-500/10 text-red-600 border-red-200', // در صورت نیاز
        };
        const labels = {
            active: 'فعال',
            pending: 'در انتظار',     // ✅
            paused: 'تعلیق',
            banned: 'مسدود',
            rejected: 'رد شده',
            removed: 'حذف شده',
        };
        const icons = {
            active: CheckCircle,
            pending: Clock,           // ✅
            paused: Clock,
            banned: XCircle,
            rejected: XCircle,
        };
        const Icon = icons[status as keyof typeof icons] || AlertCircle;

        return (
            <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
                styles[status as keyof typeof styles] || styles.active
            )}>
            <Icon className="w-3 h-3" />
                {labels[status as keyof typeof labels] || status}
        </span>
        );
    };

    const getRoleBadge = (role: string) => {
        const styles = {
            arm_member: 'bg-purple-500/10 text-purple-600 border-purple-200',
            arm_owner: 'bg-blue-500/10 text-blue-600 border-blue-200',
            buyer: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
            viewer: 'bg-gray-500/10 text-gray-600 border-gray-200',
        };
        const labels = {
            arm_member: 'عضو',
            arm_owner: 'مدیر بازار',
            buyer: 'خریدار',
            viewer: 'بازدیدکننده',
        };

        return (
            <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border",
                styles[role as keyof typeof styles] || styles.viewer
            )}>
                {role === 'system_admin' && <Crown className="w-3 h-3" />}
                {labels[role as keyof typeof labels] || role}
            </span>
        );
    };

    const getVerificationBadge = (tier: string) => {
        if (tier === 'none' || !tier) return null;
        const colors = {
            blue: 'text-blue-600 bg-blue-50',
            silver: 'text-gray-600 bg-gray-50',
            gold: 'text-yellow-600 bg-yellow-50',
        };
        return (
            <span className={cn(
                "inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full",
                colors[tier as keyof typeof colors] || colors.blue
            )}>
                <BadgeCheck className="w-3 h-3" />
                {tier === 'gold' ? 'طلایی' : tier === 'silver' ? 'نقره‌ای' : 'آبی'}
            </span>
        );
    };

    // ============================================================
    // ✅ مودال جزئیات عضو
    // ============================================================
    const MemberDetailModal = () => {
        if (!selectedMember) return null;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-surface w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-outline-variant">
                    {/* هدر */}
                    <div className="flex items-center justify-between p-4 border-b border-outline-variant sticky top-0 bg-surface rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-on-surface">
                                    {selectedMember.user.fullName || 'کاربر ناشناس'}
                                </h3>
                                <p className="text-sm text-on-surface-variant">{selectedMember.user.phone}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsDetailModalOpen(false);
                                setSelectedMember(null);
                            }}
                            className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-on-surface-variant" />
                        </button>
                    </div>

                    {/* محتوا */}
                    <div className="p-4 space-y-4">
                        {/* اطلاعات کاربر */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface-container-low p-3 rounded-xl">
                                <p className="text-xs text-on-surface-variant">نقش</p>
                                <div className="mt-1">{getRoleBadge(selectedMember.role)}</div>
                            </div>
                            <div className="bg-surface-container-low p-3 rounded-xl">
                                <p className="text-xs text-on-surface-variant">وضعیت</p>
                                <div className="mt-1">{getStatusBadge(selectedMember.status)}</div>
                            </div>
                            <div className="bg-surface-container-low p-3 rounded-xl col-span-2">
                                <p className="text-xs text-on-surface-variant">تاریخ پیوند</p>
                                <p className="text-sm font-medium text-on-surface mt-1">
                                    {new Date(selectedMember.joinedAt).toLocaleDateString('fa-IR')}
                                </p>
                            </div>
                            <div className="bg-surface-container-low p-3 rounded-xl col-span-2">
                                <p className="text-xs text-on-surface-variant">تایید موبایل</p>
                                <p className="text-sm font-medium text-on-surface mt-1">
                                    {selectedMember.user.isPhoneVerified ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" /> تایید شده
                                        </span>
                                    ) : (
                                        <span className="text-yellow-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" /> تایید نشده
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* کسب‌وکار */}
                        {selectedMember.business ? (
                            <div className="border-t border-outline-variant pt-4">
                                <h4 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    اطلاعات کسب‌وکار
                                </h4>
                                <div className="bg-surface-container-low p-4 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-on-surface-variant">نام</span>
                                        <span className="font-medium text-on-surface">{selectedMember.business.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-on-surface-variant">نوع</span>
                                        <span className="text-sm text-on-surface">{selectedMember.business.type}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-on-surface-variant">موقعیت</span>
                                        <span className="text-sm text-on-surface flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {selectedMember.business.city}، {selectedMember.business.province}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-on-surface-variant">تیک اعتماد</span>
                                        <span>{getVerificationBadge(selectedMember.business.verificationTier)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-on-surface-variant">امتیاز اعتماد</span>
                                        <span className="font-bold text-primary">{selectedMember.business.trustScore}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-outline-variant pt-4">
                                <div className="bg-surface-container-low p-4 rounded-xl text-center text-sm text-on-surface-variant">
                                    <Building2 className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/30" />
                                    این کاربر هنوز کسب‌وکاری ثبت نکرده است
                                </div>
                            </div>
                        )}

                        {/* دکمه‌های اقدام */}
                        <div className="border-t border-outline-variant pt-4 flex gap-3">
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    setSelectedMember(null);
                                }}
                                className="flex-1 px-4 py-2 border border-outline text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium"
                            >
                                بستن
                            </button>
                            {selectedMember.business && (
                                <button
                                    onClick={() => {
                                        // TODO: رفتن به صفحه کسب‌وکار
                                        toast.info('قابلیت مشاهده کسب‌وکار به زودی اضافه می‌شود');
                                    }}
                                    className="flex-1 px-4 py-2 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    مشاهده کسب‌وکار
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // ✅ در حال بارگذاری
    // ============================================================
    if (loading && members.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-on-surface-variant">در حال بارگذاری اعضا...</p>
                </div>
            </div>
        );
    }

    // ============================================================
    // ✅ رندر اصلی
    // ============================================================
    return (
        <div>
            {/* هدر */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">مدیریت اعضا</h1>
                    <p className="text-sm text-on-surface-variant">
                        {currentArm?.name || currentSlug} | مدیریت اعضای بازار
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-surface-container-low px-3 py-1.5 rounded-lg">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{totalItems} عضو</span>
                    <span className="text-on-surface-variant/50">|</span>
                    <span className="text-green-600">{stats.active} فعال</span>
                </div>
            </div>

            {/* کارت‌های آماری */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-surface-container-low border border-outline-variant p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-primary">{totalItems}</p>
                    <p className="text-[10px] text-on-surface-variant">کل اعضا</p>
                </div>
                <div className="bg-surface-container-low border border-outline-variant p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                    <p className="text-[10px] text-on-surface-variant">فعال</p>
                </div>
                <div className="bg-surface-container-low border border-outline-variant p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                    <p className="text-[10px] text-on-surface-variant">مدیر</p>
                </div>
                <div className="bg-surface-container-low border border-outline-variant p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.sellers + stats.buyers}</p>
                    <p className="text-[10px] text-on-surface-variant">فروشنده/خریدار</p>
                </div>
            </div>

            {/* فیلترها */}
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="جستجوی نام، شماره یا کسب‌وکار..."
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 pr-9 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline rounded-lg text-sm hover:border-primary/50 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        فیلترها
                        {(roleFilter !== 'all' || statusFilter !== 'all') && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                    </button>

                    {(roleFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setRoleFilter('all');
                                setStatusFilter('all');
                            }}
                            className="text-xs text-error hover:underline flex items-center gap-1"
                        >
                            <X className="w-3 h-3" />
                            پاک کردن فیلترها
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-outline-variant/50">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-on-surface-variant">نقش:</span>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                                className="bg-surface-container-lowest border border-outline rounded-lg h-8 px-2 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            >
                                <option value="all">همه</option>
                                <option value="arm_member">مدیر بازار</option>
                                <option value="arm_owner">عضو بازار</option>

                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-on-surface-variant">وضعیت:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="bg-surface-container-lowest border border-outline rounded-lg h-8 px-2 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            >
                                <option value="all">همه</option>
                                <option value="pending">در انتظار تأیید</option>
                                <option value="active">فعال</option>
                                <option value="paused">تعلیق</option>
                                <option value="banned">مسدود</option>
                                <option value="removed">حذف شده</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-on-surface-variant">مرتب‌سازی:</span>
                            <select
                                value={`${sortField}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split('-');
                                    setSortField(field as SortField);
                                    setSortOrder(order as SortOrder);
                                }}
                                className="bg-surface-container-lowest border border-outline rounded-lg h-8 px-2 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            >
                                <option value="joinedAt-desc">جدیدترین</option>
                                <option value="joinedAt-asc">قدیمی‌ترین</option>
                                <option value="user.fullName-asc">نام (الفبا)</option>
                                <option value="user.fullName-desc">نام (الفبا معکوس)</option>
                                <option value="role-asc">نقش</option>
                                <option value="status-asc">وضعیت</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* لیست اعضا */}
            {members.length === 0 ? (
                <div className="text-center py-12 bg-surface-container-low border border-outline-variant rounded-xl">
                    <Users className="w-16 h-16 text-on-surface-variant/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-on-surface">هیچ عضوی یافت نشد</h3>
                    <p className="text-sm text-on-surface-variant">
                        {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                            ? 'با فیلترهای اعمال‌شده هیچ عضوی پیدا نشد'
                            : 'هیچ کسی در این بازار عضو نشده است'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                {/* اطلاعات کاربر */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium text-sm text-on-surface truncate">
                                                {member.user.fullName || 'کاربر ناشناس'}
                                            </p>
                                            {getRoleBadge(member.role)}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                                            <span>{member.user.phone}</span>
                                            {member.business && (
                                                <>
                                                    <span className="text-on-surface-variant/30">|</span>
                                                    <span className="truncate max-w-[120px]">{member.business.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* اطلاعات تکمیلی */}
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(member.joinedAt).toLocaleDateString('fa-IR')}
                                    </div>
                                    {member.business && (
                                        <div className="flex items-center gap-0.5">
                                            {getVerificationBadge(member.business.verificationTier)}
                                        </div>
                                    )}
                                    <div>{getStatusBadge(member.status)}</div>
                                </div>

                                {/* دکمه‌ها */}
                                <div className="flex items-center gap-1.5 self-end sm:self-center">
                                    <Link
                                        href={`/arm-admin/members/${member.userId}`}
                                        className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors"
                                        title="مشاهده جزئیات"
                                    >
                                        <Eye className="w-4 h-4 text-on-surface-variant" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* پیجینگ */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/50">
                    <span className="text-sm text-on-surface-variant">
                        نمایش {((page - 1) * limit) + 1} تا {Math.min(page * limit, totalItems)} از {totalItems}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 border border-outline rounded-lg text-sm hover:bg-surface-container-low transition-colors disabled:opacity-50"
                        >
                            قبلی
                        </button>
                        <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm">
                            {page}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 border border-outline rounded-lg text-sm hover:bg-surface-container-low transition-colors disabled:opacity-50"
                        >
                            بعدی
                        </button>
                    </div>
                </div>
            )}

            {/* مودال جزئیات */}
            {isDetailModalOpen && <MemberDetailModal />}
        </div>
    );
}