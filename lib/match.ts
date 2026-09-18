// lib/match.ts
// هلپرهای مچینگ دوطرفهٔ خریدار↔تامین‌کننده
// سطح سفارش از برآورد ارزش معامله (قیمت × حجم) حدس زده می‌شود —
// همان «هماهنگی نسبیِ» سطح فروش تامین‌کننده با سطح خرید خریدار.

export interface TierInfo {
    label: string;
    cls: string;
}

export function tierLabel(tier?: string | null): TierInfo | null {
    if (!tier) return null;
    if (tier === 'bulk') {
        return {
            label: 'بنکداری/صنعتی',
            cls: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
        };
    }
    if (tier === 'wholesale') {
        return {
            label: 'عمده',
            cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        };
    }
    return {
        label: 'خرده',
        cls: 'bg-stone-100 text-stone-500 dark:bg-gray-800 dark:text-gray-400',
    };
}
