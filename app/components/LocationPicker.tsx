// app/components/LocationPicker.tsx
// ✅ انتخاب لوکیشن دقیق — نقشهٔ OpenStreetMap (لیفلت) + «موقعیت فعلی من»
//    اختیاری و بی‌اصرار: اگر دسترسی موقعیت داده نشد، فقط مزیتش گفته می‌شود و انتخابِ دستی ممکن است.
//    🌍 روی draft یک جستجوی معکوس (Nominatim) debounce شده می‌رود تا آدرس پیش‌نمایش شود؛
//    هنگام «تایید این نقطه» نتیجه با onResolved به فرم می‌رسد تا استان/شهر/آدرس خودکار آپدیت شوند.
'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Check, Crosshair, Loader2, MapPin, Trash2 } from 'lucide-react';
import { reverseGeocode, ReverseGeoResult } from '@/lib/reverseGeo';

export interface LatLngValue {
    lat: number;
    lng: number;
}

interface Props {
    value: LatLngValue | null;
    onChange: (v: LatLngValue | null) => void;
    /** نتیجهٔ جستجوی معکوسِ نقطهٔ تأییدشده — فرم‌ها با آن استان/شهر/آدرس را آپدیت می‌کنند */
    onResolved?: (geo: ReverseGeoResult | null, coords: LatLngValue) => void;
}

// مرکز نقشه وقتی هنوز نقطه‌ای انتخاب نشده — کل ایران
const IRAN_CENTER: [number, number] = [32.4279, 53.688];

/** سوزنِ سبزِ برند — به‌جای آیکونِ پیش‌فرضِ لیفلت (تصویرش در باندلر می‌شکند) */
function makePinIcon(L: any) {
    return L.divIcon({
        className: 'dm-location-pin',
        html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="#16a34a"/>
            <circle cx="14" cy="14" r="5.5" fill="#ffffff"/>
        </svg>`,
        iconSize: [28, 40],
        iconAnchor: [14, 38],
    });
}

export default function LocationPicker({ value, onChange, onResolved }: Props) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<LatLngValue | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    // 🌍 پیش‌نمایش آدرسِ نقطهٔ انتخابی + وضعیت انتظارِ تشخیص آدرس هنگام تایید
    const [geoPreview, setGeoPreview] = useState<ReverseGeoResult | null>(null);
    const [confirming, setConfirming] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const leafletRef = useRef<any>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const circleRef = useRef<any>(null);
    const geoReqRef = useRef<{ coords: LatLngValue; promise: Promise<ReverseGeoResult | null> } | null>(null);
    const geoSeqRef = useRef(0);

    // جستجوی معکوسِ نقطه — آخرین درخواست همیشه برنده است
    const resolveFor = (coords: LatLngValue) => {
        const seq = ++geoSeqRef.current;
        const promise = reverseGeocode(coords.lat, coords.lng).then((g) => {
            if (seq === geoSeqRef.current) setGeoPreview(g);
            return g;
        });
        geoReqRef.current = { coords, promise };
    };

    // debounce — کلیک/کشیدن سوزن/GPS هرکدام یک بار پرسیده شوند
    useEffect(() => {
        if (!draft) {
            setGeoPreview(null); // انصراف/پاک‌سازی — پیش‌نمایشِ کهنه نماند
            return;
        }
        const t = setTimeout(() => resolveFor(draft), 700);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft?.lat, draft?.lng]);

    const addMarker = (L: any, map: any, p: LatLngValue) => {
        if (markerRef.current) {
            markerRef.current.setLatLng([p.lat, p.lng]);
        } else {
            markerRef.current = L.marker([p.lat, p.lng], { icon: makePinIcon(L), draggable: true }).addTo(map);
            markerRef.current.on('dragend', () => {
                const ll = markerRef.current.getLatLng();
                setDraft({ lat: ll.lat, lng: ll.lng });
            });
        }
        setDraft(p);
    };

    // ─── ساخت نقشه فقط وقتی باز است — leaflet به window نیاز دارد، پس فقط سمت کلاینت و lazy ───
    useEffect(() => {
        if (!open) return;
        let disposed = false;
        let map: any = null;
        (async () => {
            const mod: any = await import('leaflet');
            const L = mod.default ?? mod;
            if (disposed || !containerRef.current) return;
            leafletRef.current = L;
            const start = value ? ([value.lat, value.lng] as [number, number]) : null;
            map = L.map(containerRef.current, {
                center: start ?? IRAN_CENTER,
                zoom: start ? 16 : 5,
                scrollWheelZoom: false, // اسکرولِ فرم قاپیده نشود
            });
            mapRef.current = map;
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);
            if (start) addMarker(L, map, { lat: start[0], lng: start[1] });
            map.on('click', (e: any) => addMarker(L, map, { lat: e.latlng.lat, lng: e.latlng.lng }));
            // اطمینان از رندر درست داخل مودالِ انیمیشن‌دار
            setTimeout(() => { if (!disposed) map?.invalidateSize(); }, 200);
        })();
        return () => {
            disposed = true;
            map?.remove?.();
            mapRef.current = null;
            markerRef.current = null;
            circleRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // ─── موقعیت فعلی — اگر اجازه نداد، اصرار نیست؛ انتخابِ دستی همیشه ممکن است ───
    const locateMe = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setGpsError('مرورگرت موقعیت‌یابی نداره — نقطه رو دستی روی نقشه انتخاب کن.');
            return;
        }
        setGpsLoading(true);
        setGpsError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsLoading(false);
                const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                const L = leafletRef.current;
                const map = mapRef.current;
                if (!L || !map) return;
                addMarker(L, map, p);
                map.setView([p.lat, p.lng], 17);
                if (circleRef.current) circleRef.current.remove();
                circleRef.current = L.circle([p.lat, p.lng], {
                    radius: pos.coords.accuracy || 30,
                    color: '#16a34a',
                    weight: 1,
                    fillOpacity: 0.08,
                }).addTo(map);
            },
            (err: any) => {
                setGpsLoading(false);
                setGpsError(
                    err?.code === 1
                        ? 'دسترسی به موقعیت داده نشد؛ اشکالی نداره — نقطه رو دستی روی نقشه انتخاب کن.'
                        : 'موقعیت فعلی الان در دسترس نیست — نقطه رو دستی روی نقشه انتخاب کن.',
                );
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
        );
    };

    // تایید نقطه — اگر تشخیص آدرس در جریان است، منتظرش می‌مانیم تا فرم نتیجه را بگیرد
    const confirmPoint = async () => {
        if (!draft || confirming) return;
        setConfirming(true);
        try {
            const req = geoReqRef.current;
            const same = req && Math.abs(req.coords.lat - draft.lat) < 1e-9 && Math.abs(req.coords.lng - draft.lng) < 1e-9;
            const geo = same ? await req.promise : await reverseGeocode(draft.lat, draft.lng);
            const coords = { lat: +draft.lat.toFixed(6), lng: +draft.lng.toFixed(6) }; // ~۱۱ سانتی‌متر دقت
            onChange(coords);
            onResolved?.(geo, coords);
            setOpen(false);
            setDraft(null);
            setGeoPreview(null);
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="space-y-2">
            {/* حالت ۱ — هنوز لوکیشنی نیست: مزیت + دکمهٔ شروع */}
            {!value && !open && (
                <>
                    <p className="text-[10px] leading-4 text-on-surface-variant/60">
                        اگر می‌خوای خریدارها و تأمین‌کننده‌ها راحت‌تر پیدات کنن و شناخت بهتری ازت داشته باشن،
                        می‌تونی لوکیشن دقیق کسب‌وکارت رو ثبت کنی.
                    </p>
                    <button type="button" onClick={() => setOpen(true)}
                            className="w-full h-9 rounded-xl border border-dashed border-outline-variant/50 dark:border-gray-700
                                text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors
                                flex items-center justify-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        انتخاب لوکیشن روی نقشه
                    </button>
                </>
            )}

            {/* حالت ۲ — لوکیشن ثبت شده: چیپ تأیید + ویرایش/حذف */}
            {value && !open && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 px-3 py-2.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-primary">لوکیشن ثبت شد</p>
                        <p className="text-[9px] text-on-surface-variant/60 truncate" dir="ltr">
                            {value.lat.toFixed(5)} , {value.lng.toFixed(5)}
                        </p>
                    </div>
                    <button type="button" onClick={() => { setDraft(value); setOpen(true); }}
                            className="text-[10px] font-bold text-primary hover:underline shrink-0">
                        ویرایش
                    </button>
                    <button type="button" onClick={() => onChange(null)} aria-label="حذف لوکیشن"
                            className="w-7 h-7 grid place-items-center rounded-lg text-error hover:bg-error/10 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* حالت ۳ — نقشه باز است */}
            {open && (
                <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-outline-variant/40 dark:border-gray-700">
                        <div ref={containerRef} className="h-56 w-full bg-surface-container-high" />
                        <button type="button" onClick={locateMe} disabled={gpsLoading}
                                className="absolute top-2 right-2 z-[800] h-8 px-2.5 rounded-lg bg-white/95 dark:bg-gray-900/95
                                    shadow text-[10px] font-bold text-stone-700 dark:text-gray-200
                                    flex items-center gap-1.5 hover:bg-white transition-colors disabled:opacity-60">
                            {gpsLoading
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Crosshair className="w-3.5 h-3.5 text-primary" />}
                            موقعیت فعلی من
                        </button>
                    </div>

                    {gpsError && (
                        <p className="text-[10px] leading-4 text-amber-600 dark:text-amber-400">{gpsError}</p>
                    )}

                    <p className="text-[10px] leading-4 text-on-surface-variant/60">
                        {draft
                            ? 'نقطه انتخاب شد — با کشیدن سوزن می‌تونی دقیق‌ترش کنی.'
                            : 'روی نقشه بزن تا نقطهٔ دقیق کسب‌وکارت انتخاب بشه؛ یا از «موقعیت فعلی من» استفاده کن.'}
                    </p>

                    {/* 🌍 پیش‌نمایش آدرسِ نقطهٔ انتخابی — با تایید، استان/شهر/آدرس فرم خودکار آپدیت می‌شوند */}
                    {draft && geoPreview && (
                        <p className="text-[10px] leading-4 text-on-surface-variant/80 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <span>
                                {geoPreview.outsideIran
                                    ? 'این نقطه خارج از ایرانه — استان و شهر باید دستی انتخاب بشن.'
                                    : `نقطهٔ انتخابی: ${geoPreview.addressLine || geoPreview.displayName || ''}`}
                            </span>
                        </p>
                    )}

                    <div className="flex gap-2">
                        <button type="button" onClick={confirmPoint} disabled={!draft || confirming}
                                className="flex-1 h-9 rounded-xl bg-primary text-on-primary text-[11px] font-extrabold
                                    flex items-center justify-center gap-1.5 disabled:opacity-40 transition-opacity">
                            {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            {confirming ? 'در حال تشخیص آدرس…' : 'تایید این نقطه'}
                        </button>
                        <button type="button" onClick={() => { setOpen(false); setDraft(null); }}
                                className="h-9 px-4 rounded-xl border border-outline-variant/40 dark:border-gray-700
                                    text-[11px] font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">
                            انصراف
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
