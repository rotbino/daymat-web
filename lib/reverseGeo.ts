// lib/reverseGeo.ts
// 🌍 جستجوی معکوس (reverse geocode) با Nominatim/OpenStreetMap + تطبیق با درخت لوکیشن آی مچ
//    از روی نقطهٔ انتخابی کاربر: کشور/استان/شهر + آدرس نسبی درمی‌آید تا فرم‌ها بتوانند
//    استان و شهر را خودکار آپدیت کنند (حتی اگر کاربر قبلاً انتخاب کرده باشد) و آدرسِ
//    دست‌نخورده را خودکار پر کنند. شکستِ آن بی‌صدا است — فقط یک مزیت است، نه گره.
'use client';

export interface ReverseGeoResult {
    countryCode: string | null; // «IR»
    country: string | null; // «ایران»
    province: string | null; // «تهران» — بدون پیشوند «استان»
    city: string | null; // بهترین نام شهر/شهرستان/روستا
    /** نام‌های کاندید شهر برای تطبیق با درخت — از خاص تا عام */
    cityCandidates: string[];
    /** آدرس نسبی — «خیابان …، محله …، شهر، استان» */
    addressLine: string | null;
    /** متن کامل Nominatim (پشتیبان نمایش) */
    displayName: string | null;
    outsideIran: boolean;
}

interface LocationNode {
    id?: string;
    title?: string;
    type?: string;
    provinceCode?: string | null;
    cityCode?: string | null;
    children?: LocationNode[];
}

export interface TreeMatch {
    provinceCode: string;
    provinceTitle: string;
    cityCode?: string;
    cityTitle?: string;
}

// ─── نرمال‌سازی فارسی — «استان تهران» و «تهران» یکی شوند؛ ی/ک عربی و نیم‌فاصله یکدست شوند ───
export function normalizeFa(s?: string | null): string {
    if (!s) return '';
    return s
        .replace(/[\u200c\u200d\u200e\u200f\uFEFF]/g, ' ') // نیم‌فاصله و کنترل‌ها
        .replace(/[يى]/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/[ۀة]/g, 'ه')
        .replace(/[\u064B-\u065F\u0670]/g, '') // اعراب
        .replace(/\s+/g, ' ')
        .replace(/^(استان|شهرستان)\s+/, '')
        .trim();
}

// ─── حافظهٔ کوتاه — هر نقطه فقط یک بار پرسیده شود (~۱۱ متر دقتِ کلید) ───
const geoCache = new Map<string, ReverseGeoResult | null>();

/** جستجوی معکوس — خروجی null یعنی «در دسترس نبود» و فرم‌ها دست‌نخورده می‌مانند */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeoResult | null> {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (geoCache.has(key)) return geoCache.get(key)!;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fa`;
        const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`nominatim ${res.status}`);
        const out = parseNominatim(await res.json());
        geoCache.set(key, out);
        return out;
    } catch {
        return null; // بی‌سروصدا — آپدیت خودکار فقط مزیت است
    } finally {
        clearTimeout(timer);
    }
}

function parseNominatim(data: any): ReverseGeoResult | null {
    if (!data || data.error || !data.address) return null;
    const a = data.address || {};

    const countryCode = (a.country_code || '').toUpperCase() || null;
    const outsideIran = countryCode !== 'IR';
    const provinceRaw: string | null = a.state || a.province || null;
    const province = provinceRaw ? provinceRaw.replace(/^استان\s+/, '').trim() : null;
    const cityRaw: string | null = a.city || a.town || a.village || a.municipality || a.county || null;
    const cityCandidates = [a.city, a.town, a.village, a.municipality, a.county, a.city_district, a.suburb]
        .filter(Boolean)
        .map((s: string) => s.trim());

    // آدرس نسبی — قطعات معنادار و بدون تکرار (حداکثر ۴ قطعه)
    const parts = [a.road, a.pedestrian, a.neighbourhood, a.quarter, a.city_district, a.suburb, cityRaw, provinceRaw]
        .filter(Boolean)
        .map((s: string) => s.trim());
    const seen = new Set<string>();
    const addressLine = parts
        .filter((p) => {
            const k = normalizeFa(p);
            if (!k || seen.has(k)) return false;
            seen.add(k);
            return true;
        })
        .slice(0, 4)
        .join('، ');

    return {
        countryCode,
        country: a.country || null,
        province,
        city: cityRaw,
        cityCandidates,
        addressLine: addressLine || data.display_name || null,
        displayName: data.display_name || null,
        outsideIran,
    };
}

// ─── تطبیق با درخت لوکیشن آی مچ (country → province → city) ───
// اول استان با نامِ (بی‌پیشوندِ) state جور می‌شود؛ بعد شهر در همان استان.
// اگر استان جور نشد، شهر در کل درخت جستجو می‌شود و استان از والدش درمی‌آید.
export function matchLocationFromTree(tree: LocationNode[] | null | undefined, geo: ReverseGeoResult): TreeMatch | null {
    if (!tree || !Array.isArray(tree) || !geo || geo.outsideIran) return null;

    const provinces: Array<{ code: string; title: string; cities: Array<{ code: string; title: string }> }> = [];
    const walk = (nodes: LocationNode[]) => {
        for (const n of nodes || []) {
            if (n.type === 'province' && (n.provinceCode || n.id)) {
                provinces.push({
                    code: (n.provinceCode || n.id)!,
                    title: n.title || '',
                    cities: (n.children || [])
                        .filter((c) => c.type === 'city' || c.cityCode)
                        .map((c) => ({ code: (c.cityCode || c.id)!, title: c.title || '' })),
                });
            } else if (n.children?.length) {
                walk(n.children);
            }
        }
    };
    walk(tree);
    if (!provinces.length) return null;

    const provinceCandidates = [geo.province].map(normalizeFa).filter(Boolean);
    const matchProvince = () => {
        let p = provinces.find((x) => provinceCandidates.includes(normalizeFa(x.title)));
        if (!p && provinceCandidates.length) {
            p = provinces.find((x) => {
                const t = normalizeFa(x.title);
                return t.length >= 3 && provinceCandidates.some((c) => c.includes(t) || t.includes(c));
            });
        }
        return p;
    };

    const cityCandidates = geo.cityCandidates.map(normalizeFa).filter(Boolean);
    const matchCity = (list: Array<{ code: string; title: string }>) => {
        let c = list.find((x) => cityCandidates.includes(normalizeFa(x.title)));
        if (!c && cityCandidates.length) {
            c = list.find((x) => {
                const t = normalizeFa(x.title);
                return t.length >= 3 && cityCandidates.some((cc) => cc.includes(t) || t.includes(cc));
            });
        }
        return c;
    };

    const province = matchProvince();
    if (province) {
        const city = matchCity(province.cities);
        return city
            ? { provinceCode: province.code, provinceTitle: province.title, cityCode: city.code, cityTitle: city.title }
            : { provinceCode: province.code, provinceTitle: province.title };
    }

    // استان تطبیق نشد — شاید خود شهر در درخت باشد (استان از والدش درمی‌آید)
    for (const p of provinces) {
        const city = matchCity(p.cities);
        if (city) return { provinceCode: p.code, provinceTitle: p.title, cityCode: city.code, cityTitle: city.title };
    }
    return null;
}
