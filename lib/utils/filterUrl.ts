// lib/utils/filterUrl.ts
import { nodeUnitLabel } from './unitLabel';

export interface CategoryNode {
    id: string;
    title: string;
    children?: CategoryNode[];
    unitShortCode?: string;
    [key: string]: any;
}

export interface FilterUrlChanges {
    categoryId?: string | null;
    search?: string | null;
    minq?: string | null;
    minstock?: string | null;
    sort?: string | null;
    page?: string | null;
    // ✅ فیلترهای بازار (فیلتربار توسعه‌پذیر)
    brand?: string | null;      // شناسهٔ برندها جداشده با ویرگول
    minp?: string | null;       // حداقل قیمت (قیمت تکی مصرف‌کننده)
    maxp?: string | null;       // حداکثر قیمت
    chk?: string | null;        // '1' = فقط چکی
    chkmin?: string | null;     // حداقل مهلت چک (روز)
    chkmax?: string | null;     // حداکثر مهلت چک (روز)
    resetAll?: boolean;
}

export interface ActiveChip {
    key: string;
    label: string;
    href: string;
}

// ─── جستجو در درخت دسته‌بندی ───

export function findNodeById(tree: CategoryNode[], id: string): CategoryNode | null {
    for (const node of tree) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

export function findPathToNode(tree: CategoryNode[], id: string): CategoryNode[] | null {
    for (const node of tree) {
        if (node.id === id) return [node];
        if (node.children) {
            const found = findPathToNode(node.children, id);
            if (found) return [node, ...found];
        }
    }
    return null;
}

export function findCategoryPathTitles(tree: CategoryNode[], id: string): string[] {
    for (const node of tree) {
        if (node.id === id) return [node.title];
        if (node.children) {
            const found = findCategoryPathTitles(node.children, id);
            if (found) return [node.title, ...found];
        }
    }
    return [];
}

/** اجداد گره (بدون خودش) — برای auto-expand سایدبار */
export function findAncestorIds(tree: CategoryNode[], id: string): string[] {
    const path = findPathToNode(tree, id);
    return path ? path.slice(0, -1).map((n) => n.id) : [];
}

/** ریشه (سطح اول)ِ گره انتخابی — برای سایدبار باسکولی */
export function findRootNode(tree: CategoryNode[], id: string): CategoryNode | null {
    return findPathToNode(tree, id)?.[0] ?? null;
}

// ─── ساخت URL فیلترها ───

function setOrDelete(params: URLSearchParams, key: string, value: string | null | undefined) {
    if (value === undefined) return;
    if (value === null || value === '') params.delete(key);
    else params.set(key, value);
}

/**
 * تنها نقطهٔ ساخت URL فیلترها در کل برنامه.
 * undefined = دست نخوردن پارامتر | null = حذف | رشته = مقداردهی
 * پیش‌فرض: هر تغییر فیلتر، page را حذف می‌کند (بازگشت به صفحهٔ اول).
 */
export function buildFilterHref(
    basePath: string,
    searchParams: { get?(n: string): string | null; toString(): string } | null,
    tree: CategoryNode[],
    changes: FilterUrlChanges,
): string {
    // ✅ سپر: basePath خالی = مسیر فعلی صفحه.
    // لینک نسبیِ فقط-کوئری در App Router قابل اتکا نیست (همان باگ دکمهٔ X) — پس همیشه مطلق می‌سازیم.
    const base = basePath || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const params = new URLSearchParams(searchParams?.toString() ?? '');

    if (changes.resetAll) {
        ['category', 'path', 'search', 'minq', 'minstock', 'sort', 'page',
         'brand', 'minp', 'maxp', 'chk', 'chkmin', 'chkmax'].forEach((k) => params.delete(k));
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
    }

    if (changes.categoryId !== undefined) {
        if (changes.categoryId) {
            params.set('category', changes.categoryId);
            const titles = findCategoryPathTitles(tree, changes.categoryId);
            if (titles.length > 0) params.set('path', titles.join('/'));
            else params.delete('path');
        } else {
            params.delete('category');
            params.delete('path');
        }
    }

    setOrDelete(params, 'search', changes.search);
    setOrDelete(params, 'minq', changes.minq);
    setOrDelete(params, 'minstock', changes.minstock);
    setOrDelete(params, 'sort', changes.sort);
    // ✅ فیلترهای بازار
    setOrDelete(params, 'brand', changes.brand);
    setOrDelete(params, 'minp', changes.minp);
    setOrDelete(params, 'maxp', changes.maxp);
    setOrDelete(params, 'chk', changes.chk);
    setOrDelete(params, 'chkmin', changes.chkmin);
    setOrDelete(params, 'chkmax', changes.chkmax);
    setOrDelete(params, 'page', changes.page !== undefined ? changes.page : null);

    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
}

const faNum = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString('fa-IR') : v;
};

/** چیپ‌های فیلتر فعال بر اساس URL — با امکان استثنا (چیپی که جای دیگری نمایش داده می‌شود) */
export function buildActiveChips(
    basePath: string,
    searchParams: { get(name: string): string | null; toString(): string },
    tree: CategoryNode[],
    exclude: string[] = [],
): ActiveChip[] {
    const chips: ActiveChip[] = [];

    const category = searchParams.get('category');
    if (category) {
        const node = findNodeById(tree, category);
        chips.push({
            key: 'category',
            label: node?.title ?? category,
            href: buildFilterHref(basePath, searchParams, tree, { categoryId: null }),
        });
    }

    const search = searchParams.get('search');
    if (search) {
        chips.push({
            key: 'search',
            label: `«${search}»`,
            href: buildFilterHref(basePath, searchParams, tree, { search: null }),
        });
    }

    const minq = searchParams.get('minq');
    if (minq) {
        const node = category ? findNodeById(tree, category) : null;
        const unit = nodeUnitLabel(node, ''); // ✅ عنوان فارسی واحد
        chips.push({
            key: 'minq',
            label: `حداقل خرید: ${faNum(minq)}${unit ? ' ' + unit : ''}`,
            href: buildFilterHref(basePath, searchParams, tree, { minq: null }),
        });
    }

    const minstock = searchParams.get('minstock');
    if (minstock) {
        const node = category ? findNodeById(tree, category) : null;
        const unit = nodeUnitLabel(node, ''); // ✅ عنوان فارسی واحد
        chips.push({
            key: 'minstock',
            label: `حداقل موجودی: ${faNum(minstock)}${unit ? ' ' + unit : ''}`,
            href: buildFilterHref(basePath, searchParams, tree, { minstock: null }),
        });
    }

    return chips.filter((c) => !exclude.includes(c.key));
}