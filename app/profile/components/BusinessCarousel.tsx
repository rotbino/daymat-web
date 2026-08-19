// app/profile/components/BusinessCarousel.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Building2, BadgeCheck, MapPin, Phone } from 'lucide-react';
import { getApiUrl } from '@/lib/api/apiRequest';

// dynamic import Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';

interface BusinessItem {
    id: string;
    name: string;
    type: string;
    city?: string;
    province?: string;
    phone?: string;
    logoUrl?: string;
    verificationTier?: string;
    verificationStatus?: string;
    trustScore?: number;
    activeAdsCount?: number;
}

interface Props {
    businesses: BusinessItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function BusinessCarousel({ businesses, selectedId, onSelect }: Props) {
    if (!businesses.length) return null;

    return (
        <div className="w-full max-w-sm mx-auto">
            <Swiper
                effect="cards"
                grabCursor={true}
                modules={[EffectCards]}
                className="mySwiper"
                onSlideChange={(swiper) => {
                    const index = swiper.activeIndex;
                    if (businesses[index]) {
                        onSelect(businesses[index].id);
                    }
                }}
                initialSlide={businesses.findIndex(b => b.id === selectedId)}
                style={{ width: '320px', height: '200px' }}
            >
                {businesses.map((biz) => {
                    const logoUrl = biz.logoUrl ? getApiUrl(`/file/${biz.logoUrl}`) : null;
                    const isSelected = biz.id === selectedId;
                    const tierColor =
                        biz.verificationTier === 'gold' ? 'text-yellow-500' :
                            biz.verificationTier === 'silver' ? 'text-blue-500' : 'text-gray-400';
                    const tierLabel =
                        biz.verificationTier === 'gold' ? 'طلایی' :
                            biz.verificationTier === 'silver' ? 'نقره‌ای' : 'آبی';

                    return (
                        <SwiperSlide key={biz.id}>
                            <div
                                className={cn(
                                    "relative w-full h-full bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 p-5 flex flex-col justify-between cursor-pointer",
                                    isSelected && "ring-2 ring-primary"
                                )}
                                onClick={() => onSelect(biz.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden">
                                        {logoUrl ? (
                                            <img src={logoUrl} alt={biz.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 className="w-6 h-6 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm truncate">{biz.name}</h3>
                                        {biz.city && <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/>{biz.city}</p>}
                                    </div>
                                    {biz.verificationTier && biz.verificationTier !== 'none' && (
                                        <BadgeCheck className={cn("w-5 h-5", tierColor)} />
                                    )}
                                </div>
                                <div className="text-xs text-on-surface-variant mt-3 flex justify-between">
                                    <span>{biz.activeAdsCount ?? 0} آگهی</span>
                                    <span className="font-medium">{tierLabel || 'عادی'}</span>
                                </div>
                            </div>
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </div>
    );
}