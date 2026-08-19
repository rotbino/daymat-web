// app/ad/components/AdStats.tsx
'use client';

import React, { useState } from 'react';
import {
    Eye, Heart, Phone, MessageCircle, Share2, Users,
    ChevronDown, ChevronUp, User as UserIcon, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAdStats } from '@/lib/api/apiHooks';

interface AdStatsProps {
    adId: string;
    className?: string;
}

export function AdStats({ adId, className }: AdStatsProps) {
    const [expandedType, setExpandedType] = useState<string | null>(null);

    const { data, isLoading } = useAdStats(adId);

    // استخراج داده‌ها با مقادیر پیش‌فرض
    const summary = data?.summary || {};
    const details = data?.details || {
        views: [],
        saves: [],
        calls: [],
        comments: [],
        shares: [],
    };

    // محاسبه آمار از جزئیات (در صورت نبود summary)
    const computedStats = {
        totalViews: summary.totalViews ?? details.views.length,
        uniqueViews: summary.uniqueViews ?? new Set(details.views.map((v: any) => v.userId)).size,
        totalSaves: summary.totalSaves ?? details.saves.length,
        totalCalls: summary.totalCalls ?? details.calls.length,
        totalComments: summary.totalComments ?? details.comments.length,
        totalShares: summary.totalShares ?? details.shares.length,
    };

    const statItems = [
        { key: 'views', label: 'بازدید کل', value: computedStats.totalViews, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
        { key: 'uniqueViews', label: 'بازدیدکنندگان منحصربه‌فرد', value: computedStats.uniqueViews, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { key: 'calls', label: 'تماس‌ها', value: computedStats.totalCalls, icon: Phone, color: 'text-green-600', bg: 'bg-green-50' },
        { key: 'saves', label: 'ذخیره‌ها', value: computedStats.totalSaves, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
        { key: 'comments', label: 'نظرات', value: computedStats.totalComments, icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
        { key: 'shares', label: 'اشتراک‌گذاری', value: computedStats.totalShares, icon: Share2, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const toggleExpand = (key: string) => {
        setExpandedType(expandedType === key ? null : key);
    };

    const renderUserList = (users: any[], type: string) => {
        if (!users || users.length === 0) {
            return <p className="text-xs text-gray-400 py-2">هیچ کاربری ثبت نشده است.</p>;
        }
        return (
            <div className="space-y-1.5 mt-2">
                {users.slice(0, 10).map((user) => (
                    <div key={user.userId} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {user.avatarUrl ? (
                                <Image
                                    src={user.avatarUrl}
                                    alt={user.fullName || 'کاربر'}
                                    width={24}
                                    height={24}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                />
                            ) : (
                                <UserIcon className="w-3 h-3 text-gray-400 m-auto mt-1.5" />
                            )}
                        </div>
                        <span className="flex-1 truncate">{user.fullName || 'کاربر ناشناس'}</span>
                        <span className="text-[9px] text-gray-400">{new Date(user.interactedAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                ))}
                {users.length > 10 && (
                    <p className="text-[10px] text-primary cursor-pointer hover:underline">
                        +{users.length - 10} نفر دیگر
                    </p>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* کارت‌های خلاصه */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {statItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.key}
                            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md"
                        >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2", item.bg)}>
                                <Icon className={cn("w-5 h-5", item.color)} />
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {item.value.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* جزئیات (لیست کاربران) */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">جزئیات تعاملات</h4>
                <div className="space-y-2">
                    {statItems.map((item) => {
                        if (item.key === 'uniqueViews') return null;
                        const users = details[item.key as keyof typeof details] || [];
                        const isExpanded = expandedType === item.key;
                        return (
                            <div key={item.key} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleExpand(item.key)}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        <item.icon className={cn("w-4 h-4", item.color)} />
                                        {item.label}
                                        <span className="text-xs text-gray-400 font-normal">({users.length})</span>
                                    </span>
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {isExpanded && (
                                    <div className="p-3 bg-white dark:bg-gray-900">
                                        {renderUserList(users, item.key)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}