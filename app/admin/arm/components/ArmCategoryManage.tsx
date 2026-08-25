// app/admin/arm/components/CategorySection/ArmCategoryManager.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
    Search, ChevronLeft, Plus, Trash2,
    Package, Layers, X, FolderPlus, Check, Minus,
    Sparkles, TreePine, ShoppingCart,
    GripVertical, Edit3, Settings, FolderOpen, Folder,
    ListPlus, AlertTriangle, Star, Pencil, Ruler, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCategoriesFlat, useUnits } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService'; // ✅ اضافه شد
// ============================================================
// تنظیمات
// ============================================================
/** حداقل تعداد حروف برای فعال شدن جستجو */
const MIN_SEARCH_CHARS = 2;
/** دیبانس جستجوی درخت مرجع (میلی‌ثانیه) */
const SEARCH_DEBOUNCE_MS = 300;
/** دیبانس جستجوی اصلی پنل‌ها */
const MAIN_SEARCH_DEBOUNCE_MS = 200;

// ============================================================
// Types
// ============================================================
interface TreeNode {
    id: string;
    title: string;
    categoryId?: string;
    parentId?: string | null;
    children?: TreeNode[];
    isLeaf?: boolean;
    overrideUnitId?: string;
    overrideUnitTitle?: string;
    overrideMinQuantity?: number | null;
    customLabel?: string;
    path?: string;
    level?: number;
    [key: string]: any;
}

interface UnitInfo {
    id: string;
    title: string;
    shortCode: string;
}

type CheckState = 'checked' | 'indeterminate' | 'unchecked';

interface DeleteConfirmData {
    nodeId: string;
    title: string;
    tree: 'scope' | 'final';
}

// ============================================================
// توابع کمکی عمومی
// ============================================================

/** تبدیل عدد به ارقام فارسی */
function toFa(n: number): string {
    return new Intl.NumberFormat('fa-IR').format(n);
}

/** نرمال‌سازی متن فارسی برای جستجوی بهتر (ي/ك عربی، نیم‌فاصله و ...) */
function normalizeFa(input: string): string {
    return (input || '')
        .replace(/[\u200c\u200f\u200e]/g, '')
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ی')
        .replace(/[ةۀ]/g, 'ه')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

/** دیبانس یک مقدار */
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

/** حذف پوشه‌های خالی (لنگرهای بدون بچه) — آگاه از داده مرجع */
function removeEmptyFolders(nodes: TreeNode[], childrenMap?: Map<string, any[]>): TreeNode[] {
    return nodes
        .map(node => ({
            ...node,
            children: node.children ? removeEmptyFolders(node.children, childrenMap) : [],
        }))
        .filter(node => {
            if (node.isLeaf === true) return true;
            const hasChildren = (node.children?.length ?? 0) > 0;
            if (hasChildren) return true;
            if (node.isLeaf === false) return false;
            // تشخیص از روی داده مرجع: اگر پوشه مرجع است ولی بچه‌ای در درخت ندارد → حذف
            if (childrenMap) {
                return (childrenMap.get(node.id)?.length ?? 0) === 0;
            }
            return false;
        });
}

function removeNodeFromTree(nodes: TreeNode[], nodeId: string): TreeNode[] {
    return nodes
        .filter(node => node.id !== nodeId)
        .map(node => ({
            ...node,
            children: node.children ? removeNodeFromTree(node.children, nodeId) : [],
        }));
}

function addNodeToTree(nodes: TreeNode[], parentId: string | null, newNode: TreeNode): TreeNode[] {
    if (parentId === null) {
        return [...nodes, newNode];
    }
    return nodes.map(node => {
        if (node.id === parentId) {
            return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
            return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
        }
        return node;
    });
}

function updateNodeInTree(nodes: TreeNode[], nodeId: string, updates: Partial<TreeNode>): TreeNode[] {
    return nodes.map(node => {
        if (node.id === nodeId) {
            return { ...node, ...updates };
        }
        if (node.children) {
            return { ...node, children: updateNodeInTree(node.children, nodeId, updates) };
        }
        return node;
    });
}

function buildTreeFromFlat(nodes: TreeNode[]): TreeNode[] {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];
    for (const node of nodes) {
        map.set(node.id, { ...node, children: [] });
    }
    for (const [, node] of map) {
        if (node.parentId && map.has(node.parentId)) {
            map.get(node.parentId)!.children!.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots;
}

function findNodeInTree(nodes: TreeNode[], nodeId: string): TreeNode | null {
    for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
            const found = findNodeInTree(node.children, nodeId);
            if (found) return found;
        }
    }
    return null;
}

/** جمع‌آوری تمام شناسه‌های یک درخت */
function collectTreeIds(nodes: TreeNode[]): Set<string> {
    const ids = new Set<string>();
    const collect = (list: TreeNode[]) => {
        for (const n of list) {
            ids.add(n.id);
            if (n.children && n.children.length > 0) collect(n.children);
        }
    };
    collect(nodes);
    return ids;
}

function getAllDescendantIds(node: TreeNode): string[] {
    const ids: string[] = [];
    const collect = (n: TreeNode) => {
        if (n.children) {
            for (const child of n.children) {
                ids.push(child.id);
                collect(child);
            }
        }
    };
    collect(node);
    return ids;
}

/** فیلتر درخت با جستجو (با نرمال‌سازی فارسی) */
function filterTreeBySearch(nodes: TreeNode[], term: string): TreeNode[] {
    const nt = normalizeFa(term);
    if (!nt) return nodes;

    const filter = (node: TreeNode): TreeNode | null => {
        const selfMatch =
            normalizeFa(node.title).includes(nt) ||
            (node.path ? normalizeFa(node.path).includes(nt) : false);
        const filteredChildren = (node.children || [])
            .map(filter)
            .filter((n): n is TreeNode => n !== null);

        if (selfMatch) return { ...node }; // اگر خود نود مچ شد، کل زیردرختش نمایش داده شود
        if (filteredChildren.length > 0) return { ...node, children: filteredChildren };
        return null;
    };

    const result: TreeNode[] = [];
    for (const node of nodes) {
        const filtered = filter(node);
        if (filtered) result.push(filtered);
    }
    return result;
}

/** ساخت Map والد → بچه‌ها از لیست مسطح مرجع */
function buildChildrenMap(allCategories: any[]): Map<string, any[]> {
    const map = new Map<string, any[]>();
    for (const c of allCategories) {
        const key = c.parentId || '__root__';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(c);
    }
    return map;
}

/**
 * ساخت مجدد درخت مجاز از روی مجموعه شناسه‌ها
 * - والد‌های لنگر به صورت خودکار اضافه می‌شوند
 * - سفارشی‌سازی‌های قبلی نودها (مثل عنوان ویرایش‌شده) حفظ می‌شود
 * - پوشه‌های خالی حذف می‌شوند
 */
function buildScopeTreeFromIds(
    ids: Set<string>,
    currentScopeTree: TreeNode[],
    allCategories: any[],
): TreeNode[] {
    if (!allCategories || allCategories.length === 0) return currentScopeTree;

    const catMap = new Map(allCategories.map((c: any) => [c.id, c]));
    const childrenMap = buildChildrenMap(allCategories);

    const idSet = new Set(ids);

    // افزودن زنجیره والد‌ها برای تودرتویی صحیح
    for (const id of Array.from(idSet)) {
        let pid = catMap.get(id)?.parentId;
        while (pid && !idSet.has(pid)) {
            idSet.add(pid);
            pid = catMap.get(pid)?.parentId;
        }
    }

    // حفظ سفارشی‌سازی‌های موجود
    const existingMap = new Map<string, TreeNode>();
    const collectExisting = (list: TreeNode[]) => {
        for (const n of list) {
            if (!existingMap.has(n.id)) existingMap.set(n.id, n);
            if (n.children) collectExisting(n.children);
        }
    };
    collectExisting(currentScopeTree);

    const selectedNodes = allCategories
        .filter((c: any) => idSet.has(c.id))
        .map((c: any) => {
            const existing = existingMap.get(c.id);
            const base: any = existing ?? c;
            return { ...base, children: [] };
        });

    const tree = buildTreeFromFlat(selectedNodes);

    // حذف لنگرهای خالی (پوشه مرجعی که هیچ بچه انتخاب‌شده ندارد)
    const isRefFolder = (id: string) => (childrenMap.get(id)?.length ?? 0) > 0;
    const cleanup = (list: TreeNode[]): TreeNode[] =>
        list
            .map(n => ({ ...n, children: n.children ? cleanup(n.children) : [] }))
            .filter(n => (n.children?.length ?? 0) > 0 || !isRefFolder(n.id));

    return cleanup(tree);
}

/** محاسبه وضعیت تیک (کامل/نیمه/خالی) برای تمام نودها با یک پیمایش O(n) */
function buildCheckStates(roots: TreeNode[], checkedIds: Set<string>): Map<string, CheckState> {
    const states = new Map<string, CheckState>();
    const compute = (node: TreeNode): CheckState => {
        const childStates: CheckState[] = (node.children || []).map(compute);
        const selfIn = checkedIds.has(node.id);
        let state: CheckState;
        if (selfIn && childStates.every(s => s === 'checked')) state = 'checked';
        else if (selfIn || childStates.some(s => s !== 'unchecked')) state = 'indeterminate';
        else state = 'unchecked';
        states.set(node.id, state);
        return state;
    };
    roots.forEach(compute);
    return states;
}

// ============================================================
// کامپوننت‌های UI کوچک
// ============================================================

/** چک‌باکس سه‌حالته (تیک/نیمه/خالی) */
function TriStateCheckbox({ state, onClick, disabled = false, tone = 'amber' }: {
    state: CheckState;
    onClick?: () => void;
    disabled?: boolean;
    tone?: 'amber' | 'emerald';
}) {
    const tones: Record<string, { on: string; partial: string; off: string }> = {
        amber: {
            on: 'bg-amber-500 border-amber-500 text-white',
            partial: 'bg-amber-100 border-amber-400 text-amber-600 dark:bg-amber-900/60 dark:border-amber-500 dark:text-amber-300',
            off: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-amber-400',
        },
        emerald: {
            on: 'bg-emerald-500 border-emerald-500 text-white',
            partial: 'bg-emerald-100 border-emerald-400 text-emerald-600 dark:bg-emerald-900/60 dark:border-emerald-500 dark:text-emerald-300',
            off: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-400',
        },
    };
    const t = tones[tone] || tones.amber;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all flex-shrink-0',
                state === 'checked' && t.on,
                state === 'indeterminate' && t.partial,
                state === 'unchecked' && t.off,
                disabled && 'cursor-not-allowed',
            )}
        >
            {state === 'checked' && <Check className="w-3.5 h-3.5" strokeWidth={3.5} />}
            {state === 'indeterminate' && <Minus className="w-3 h-3" strokeWidth={3.5} />}
        </button>
    );
}

/** باکس جستجو با دکمه پاک کردن (✕) */
function SearchBox({ value, onChange, placeholder, autoFocus = false }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}) {
    return (
        <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="w-full h-11 pr-10 pl-10 bg-gray-50 dark:bg-gray-900/40 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none transition-all focus:border-amber-400 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-gray-800"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-600/60 transition-colors"
                    title="پاک کردن جستجو"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

/** پوسته مودال */
function ModalShell({ open, onClose, title, subtitle, icon, children, footer, maxWidth = 'max-w-2xl' }: {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}) {
    // بستن با کلید Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // قفل اسکرول body هنگام باز بودن
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
            <div className={cn('relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-100 dark:border-gray-700 flex flex-col max-h-[88vh]', maxWidth)}>
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b-2 border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {icon}
                        <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100 truncate">{title}</h3>
                            {subtitle && <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{subtitle}</p>}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
                {footer && (
                    <div className="px-4 sm:px-5 py-4 border-t-2 border-gray-100 dark:border-gray-700 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode; label: string; value: string; color: string;
}) {
    const colors: Record<string, string> = {
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    };
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-3 sm:p-4 flex items-center gap-3">
            <div className={cn('p-2 sm:p-2.5 rounded-xl flex-shrink-0', colors[color] || colors.amber)}>
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 truncate">{value}</div>
                <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{label}</div>
            </div>
        </div>
    );
}

function PanelHeader({ icon, title, subtitle, count, color, children }: {
    icon: React.ReactNode; title: string; subtitle?: string; count?: number;
    color: 'amber' | 'blue'; children?: React.ReactNode;
}) {
    const colorMap = color === 'blue'
        ? { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' }
        : { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
    return (
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 min-w-0">
                <div className={cn('p-2 rounded-xl flex-shrink-0', colorMap.bg, colorMap.text)}>{icon}</div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{title}</h3>
                        {count !== undefined && (
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 tabular-nums', colorMap.bg, colorMap.text)}>
                                {toFa(count)}
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>}
                </div>
            </div>
            {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
        </div>
    );
}

function EmptyState({ icon, title, description, action, color = 'amber', compact = false }: {
    icon: React.ReactNode; title: string; description?: string;
    action?: { label: string; onClick: () => void }; color?: string; compact?: boolean;
}) {
    const colorMap: Record<string, string> = {
        amber: 'text-amber-300 dark:text-amber-700',
        blue: 'text-blue-300 dark:text-blue-700',
    };
    return (
        <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-12 px-4')}>
            <div className={cn('mb-3', colorMap[color] || colorMap.amber)}>{icon}</div>
            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">{title}</h4>
            {description && <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 max-w-[240px]">{description}</p>}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// ============================================================
// مودال ۱: انتخاب از درخت مرجع (با تیک آبشاری)
// ============================================================
function ReferencePickerModal({ open, onClose, allCategories, currentScopeTree, onConfirm }: {
    open: boolean;
    onClose: () => void;
    allCategories: any[];
    currentScopeTree: TreeNode[];
    onConfirm: (newTree: TreeNode[]) => void;
}) {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const referenceTree = useMemo(
        () => buildTreeFromFlat(allCategories.map((c: any) => ({ ...c }))),
        [allCategories],
    );

    // Map شناسه → تمام زیرمجموعه‌ها (برای تیک آبشاری سریع)
    const descendantsMap = useMemo(() => {
        const map = new Map<string, string[]>();
        const compute = (node: TreeNode): string[] => {
            const ids: string[] = [];
            for (const child of node.children || []) {
                ids.push(child.id);
                ids.push(...compute(child));
            }
            map.set(node.id, ids);
            return ids;
        };
        referenceTree.forEach(compute);
        return map;
    }, [referenceTree]);

    // مقداردهی اولیه از درخت مجاز فعلی هنگام باز شدن
    useEffect(() => {
        if (open) {
            setCheckedIds(collectTreeIds(currentScopeTree));
            setSearch('');
            setExpanded(new Set(referenceTree.map(n => n.id)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const trimmedSearch = debouncedSearch.trim();
    const isSearching = normalizeFa(trimmedSearch).length >= MIN_SEARCH_CHARS;

    const filteredTree = useMemo(() => {
        if (!isSearching) return referenceTree;
        return filterTreeBySearch(referenceTree, trimmedSearch);
    }, [referenceTree, trimmedSearch, isSearching]);

    // هنگام جستجو همه نتایج باز شوند
    useEffect(() => {
        if (!isSearching) return;
        setExpanded(collectTreeIds(filteredTree));
    }, [isSearching, filteredTree]);

    const checkStates = useMemo(
        () => buildCheckStates(referenceTree, checkedIds),
        [referenceTree, checkedIds],
    );

    const toggleExpand = useCallback((nodeId: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    }, []);

    // ✅ تیک آبشاری: تیک زدن نود → تیک خوردن همه بچه‌ها و نوه‌ها تا آخر + باز شدن خودکار نود
    const toggleCheck = useCallback((node: TreeNode) => {
        const descendantIds = descendantsMap.get(node.id) || [];
        const isCurrentlyChecked = checkStates.get(node.id) === 'checked';

        setCheckedIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyChecked) {
                next.delete(node.id);
                descendantIds.forEach(id => next.delete(id));
            } else {
                next.add(node.id);
                descendantIds.forEach(id => next.add(id));
            }
            return next;
        });

        if (!isCurrentlyChecked) {
            // باز شدن خودکار نود و تمام زیرمجموعه‌هایش
            setExpanded(prev => {
                const next = new Set(prev);
                next.add(node.id);
                descendantIds.forEach(id => next.add(id));
                return next;
            });
        }
    }, [checkStates, descendantsMap]);

    const handleConfirm = useCallback(() => {
        const newTree = buildScopeTreeFromIds(checkedIds, currentScopeTree, allCategories);
        onConfirm(newTree);
    }, [checkedIds, currentScopeTree, allCategories, onConfirm]);

    const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
        const state = checkStates.get(node.id) || 'unchecked';
        const hasChildren = (node.children?.length ?? 0) > 0;
        const isExpanded = expanded.has(node.id);
        const descendantCount = (descendantsMap.get(node.id) || []).length;

        return (
            <div key={node.id}>
                <div
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-2 rounded-xl hover:bg-amber-50/80 dark:hover:bg-amber-900/20 transition-colors"
                    style={{ paddingRight: depth * 16 + 8 }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => toggleExpand(node.id)}
                            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800/40 rounded-lg transition-colors flex-shrink-0"
                        >
                            <div className={cn('transition-transform duration-200', !isExpanded ? 'rotate-0' : '-rotate-90')}>
                                <ChevronLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </button>
                    ) : (
                        <div className="w-6 flex-shrink-0" />
                    )}

                    <TriStateCheckbox state={state} onClick={() => toggleCheck(node)} tone="amber" />

                    {hasChildren ? (
                        <div className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                    ) : (
                        <div className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    )}

                    <span className="flex-1 min-w-0 text-right text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {node.title}
                    </span>

                    {hasChildren && descendantCount > 0 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
                            {toFa(descendantCount)} زیرمجموعه                        </span>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div className="mr-3 sm:mr-4 border-r-2 border-amber-100 dark:border-amber-800/30 rounded-r-lg">
                        {(node.children || []).map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const rawLen = normalizeFa(search.trim()).length;

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title="انتخاب از درخت مرجع"
            subtitle="با تیک زدن هر گروه، تمام زیرمجموعه‌های آن تا انتها انتخاب می‌شوند"
            icon={<div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400"><TreePine className="w-5 h-5" /></div>}
            maxWidth="max-w-3xl"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {checkedIds.size > 0 ? `${toFa(checkedIds.size)} مورد انتخاب شده` : 'موردی انتخاب نشده است'}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            انصراف
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            تأیید و ذخیره
                        </button>
                    </div>
                </div>
            }
        >
            <div className="mb-3">
                <SearchBox
                    value={search}
                    onChange={setSearch}
                    placeholder={`جستجو در درخت مرجع (حداقل ${MIN_SEARCH_CHARS} حرف)...`}
                />
                {rawLen > 0 && rawLen < MIN_SEARCH_CHARS && (
                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-2 text-right">
                        برای فعال شدن جستجو حداقل {toFa(MIN_SEARCH_CHARS)} حرف وارد کنید...
                    </p>
                )}
            </div>

            <div className="max-h-[55vh] overflow-y-auto rounded-xl border-2 border-gray-100 dark:border-gray-700 p-2 bg-gray-50/50 dark:bg-gray-900/30">
                {filteredTree.length === 0 ? (
                    <div className="py-10 text-center">
                        <Search className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500">
                            {isSearching ? 'نتیجه‌ای یافت نشد' : 'دسته‌بندی مرجعی موجود نیست'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0.5">{filteredTree.map(node => renderNode(node))}</div>
                )}
            </div>
        </ModalShell>
    );
}

// ============================================================
// مودال ۲: افزودن سریع زیرمجموعه‌ها از روی یک نود درخت مجاز
// ============================================================
function QuickAddChildrenModal({ open, onClose, parentNode, allCategories, currentScopeTree, onConfirm }: {
    open: boolean;
    onClose: () => void;
    parentNode: TreeNode | null;
    allCategories: any[];
    currentScopeTree: TreeNode[];
    onConfirm: (newTree: TreeNode[], addedCount: number) => void;
}) {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [newCheckedIds, setNewCheckedIds] = useState<Set<string>>(new Set());

    const childrenMap = useMemo(() => buildChildrenMap(allCategories), [allCategories]);

    // شناسه‌های موجود در درخت مجاز فعلی
    const scopeIds = useMemo(() => collectTreeIds(currentScopeTree), [currentScopeTree]);

    // زیردرخت مرجعِ بچه‌های نود والد
    const childTree = useMemo(() => {
        if (!parentNode || !open) return [];
        const buildNode = (c: any): TreeNode => ({
            ...c,
            children: (childrenMap.get(c.id) || []).map(buildNode),
        });
        return (childrenMap.get(parentNode.id) || []).map(buildNode);
    }, [parentNode, childrenMap, open]);

    // ریست هنگام باز شدن
    useEffect(() => {
        if (open) {
            setNewCheckedIds(new Set());
            setSearch('');
            setExpanded(new Set());
        }
    }, [open]);

    const trimmedSearch = debouncedSearch.trim();
    const isSearching = normalizeFa(trimmedSearch).length >= MIN_SEARCH_CHARS;

    const filteredTree = useMemo(() => {
        if (!isSearching) return childTree;
        return filterTreeBySearch(childTree, trimmedSearch);
    }, [childTree, trimmedSearch, isSearching]);

    useEffect(() => {
        if (!isSearching) return;
        setExpanded(collectTreeIds(filteredTree));
    }, [isSearching, filteredTree]);

    // وضعیت مؤثر = (موجود در درخت مجاز) ∪ (انتخاب‌های جدید)
    const effectiveChecked = useMemo(() => {
        const s = new Set(scopeIds);
        newCheckedIds.forEach(id => s.add(id));
        return s;
    }, [scopeIds, newCheckedIds]);

    const checkStates = useMemo(
        () => buildCheckStates(childTree, effectiveChecked),
        [childTree, effectiveChecked],
    );

    const toggleExpand = useCallback((nodeId: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    }, []);

    // تیک آبشاری — موارد موجود قفل هستند (این مودال فقط «افزودن» می‌کند)
    const toggleCheck = useCallback((node: TreeNode) => {
        if (scopeIds.has(node.id)) return;

        const descendantIds = getAllDescendantIds(node);
        const isCurrentlyChecked =
            newCheckedIds.has(node.id) && descendantIds.every(id => newCheckedIds.has(id));

        setNewCheckedIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyChecked) {
                next.delete(node.id);
                descendantIds.forEach(id => next.delete(id));
            } else {
                next.add(node.id);
                descendantIds.forEach(id => next.add(id));
            }
            return next;
        });

        if (!isCurrentlyChecked) {
            setExpanded(prev => {
                const next = new Set(prev);
                next.add(node.id);
                descendantIds.forEach(id => next.add(id));
                return next;
            });
        }
    }, [scopeIds, newCheckedIds]);

    const handleConfirm = useCallback(() => {
        if (newCheckedIds.size === 0) {
            onClose();
            return;
        }
        // مجموعه جدید = موجود‌ها + انتخاب‌های جدید به همراه تمام زیرمجموعه‌های مرجع‌شان
        const idSet = new Set(scopeIds);
        for (const id of newCheckedIds) {
            if (idSet.has(id)) continue;
            const stack = [id];
            while (stack.length > 0) {
                const cur = stack.pop()!;
                if (idSet.has(cur)) continue;
                idSet.add(cur);
                for (const child of childrenMap.get(cur) || []) stack.push(child.id);
            }
        }
        const newTree = buildScopeTreeFromIds(idSet, currentScopeTree, allCategories);
        onConfirm(newTree, newCheckedIds.size);
    }, [newCheckedIds, scopeIds, childrenMap, currentScopeTree, allCategories, onConfirm, onClose]);

    const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
        const inScope = scopeIds.has(node.id);
        const state = checkStates.get(node.id) || 'unchecked';
        const hasChildren = (node.children?.length ?? 0) > 0;
        const isExpanded = expanded.has(node.id);

        return (
            <div key={node.id}>
                <div
                    className={cn(
                        'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-2 rounded-xl transition-colors',
                        inScope
                            ? 'bg-emerald-50/60 dark:bg-emerald-900/15'
                            : 'hover:bg-amber-50/80 dark:hover:bg-amber-900/20',
                    )}
                    style={{ paddingRight: depth * 16 + 8 }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => toggleExpand(node.id)}
                            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800/40 rounded-lg transition-colors flex-shrink-0"
                        >
                            <div className={cn('transition-transform duration-200', !isExpanded ? 'rotate-0' : '-rotate-90')}>
                                <ChevronLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </button>
                    ) : (
                        <div className="w-6 flex-shrink-0" />
                    )}

                    <TriStateCheckbox
                        state={state}
                        onClick={() => toggleCheck(node)}
                        disabled={inScope}
                        tone="amber"
                    />

                    {hasChildren ? (
                        <div className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                    ) : (
                        <div className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    )}

                    <span className={cn(
                        'flex-1 min-w-0 text-right text-sm font-medium truncate',
                        inScope ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200',
                    )}>
                        {node.title}
                    </span>

                    {inScope && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                            <Check className="w-3 h-3" />
                            موجود
                        </span>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div className="mr-3 sm:mr-4 border-r-2 border-amber-100 dark:border-amber-800/30 rounded-r-lg">
                        {(node.children || []).map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const allExisting = childTree.length > 0 && childTree.every(c => scopeIds.has(c.id));
    const rawLen = normalizeFa(search.trim()).length;

    return (
        <ModalShell
            open={open && !!parentNode}
            onClose={onClose}
            title={`افزودن زیرمجموعه به «${parentNode?.title || ''}»`}
            subtitle="موارد جدید را تیک بزنید؛ با تأیید، کنار موارد موجود به درخت مجاز اضافه می‌شوند"
            icon={<div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400"><ListPlus className="w-5 h-5" /></div>}
            maxWidth="max-w-2xl"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {newCheckedIds.size > 0 ? `${toFa(newCheckedIds.size)} مورد جدید انتخاب شد` : 'مورد جدیدی انتخاب نشده'}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            انصراف
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={newCheckedIds.size === 0}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                            افزودن به درخت مجاز
                        </button>
                    </div>
                </div>
            }
        >
            {childTree.length === 0 ? (
                <EmptyState
                    icon={<ListPlus className="w-12 h-12" />}
                    title="زیرمجموعه‌ای وجود ندارد"
                    description="این دسته‌بندی در درخت مرجع هیچ زیرمجموعه‌ای ندارد"                />
            ) : (
                <>
                    <div className="mb-3">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder={`جستجو در زیرمجموعه‌ها (حداقل ${MIN_SEARCH_CHARS} حرف)...`}
                        />
                        {rawLen > 0 && rawLen < MIN_SEARCH_CHARS && (
                            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-2 text-right">
                                برای فعال شدن جستجو حداقل {toFa(MIN_SEARCH_CHARS)} حرف وارد کنید...
                            </p>
                        )}
                    </div>

                    {allExisting && (
                        <div className="mb-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                            <Check className="w-4 h-4 flex-shrink-0" />
                            تمام زیرمجموعه‌های مستقیم این نود قبلاً اضافه شده‌اند؛ می‌توانید از میان نتایج، موارد عمیق‌تر را انتخاب کنید.
                        </div>
                    )}

                    <div className="max-h-[55vh] overflow-y-auto rounded-xl border-2 border-gray-100 dark:border-gray-700 p-2 bg-gray-50/50 dark:bg-gray-900/30">
                        {filteredTree.length === 0 ? (
                            <div className="py-10 text-center">
                                <Search className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-sm text-gray-500">
                                    {isSearching ? 'نتیجه‌ای یافت نشد' : 'زیرمجموعه‌ای برای نمایش وجود ندارد'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">{filteredTree.map(node => renderNode(node))}</div>
                        )}
                    </div>
                </>
            )}
        </ModalShell>
    );
}

// ============================================================
// مودال ۳: انتخاب دسته‌بندی برای افزودن به درخت نهایی
// (چند انتخابی — فقط از بین دسته‌بندی‌های مجاز بازار)
// ============================================================
function CategoryPickerModal({ open, onClose, scopeTree, finalUsedIds, onConfirm }: {
    open: boolean;
    onClose: () => void;
    scopeTree: TreeNode[];
    finalUsedIds: Set<string>;
    onConfirm: (selected: TreeNode[]) => void;
}) {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // همه نودهای درخت مجاز (مسطح + نام والد برای راهنمایی)
    const scopeNodes = useMemo(() => {
        const list: any[] = [];
        const collect = (nodes: TreeNode[], parentTitle: string | null) => {
            for (const n of nodes) {
                list.push({ ...n, _parentTitle: parentTitle });
                if (n.children && n.children.length > 0) collect(n.children, n.title);
            }
        };
        collect(scopeTree, null);
        return list;
    }, [scopeTree]);

    useEffect(() => {
        if (open) {
            setSelectedIds(new Set());
            setSearch('');
        }
    }, [open]);

    const trimmedSearch = debouncedSearch.trim();
    const isSearching = normalizeFa(trimmedSearch).length >= MIN_SEARCH_CHARS;

    const filteredNodes = useMemo(() => {
        if (!isSearching) return scopeNodes;
        const nt = normalizeFa(trimmedSearch);
        return scopeNodes.filter((n: any) =>
            normalizeFa(n.title).includes(nt) ||
            (n._parentTitle ? normalizeFa(n._parentTitle).includes(nt) : false),
        );
    }, [scopeNodes, trimmedSearch, isSearching]);

    const toggleSelect = useCallback((node: any) => {
        if (finalUsedIds.has(node.id)) return;
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(node.id)) next.delete(node.id);
            else next.add(node.id);
            return next;
        });
    }, [finalUsedIds]);

    const handleConfirm = useCallback(() => {
        const selected = scopeNodes.filter((n: any) => selectedIds.has(n.id));
        onConfirm(selected);
    }, [scopeNodes, selectedIds, onConfirm]);

    const rawLen = normalizeFa(search.trim()).length;

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title="افزودن دسته‌بندی به درخت نهایی"
            subtitle="تنها دسته‌بندی‌های موجود در درخت مجاز بازار قابل انتخاب هستند"
            icon={<div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400"><ShoppingCart className="w-5 h-5" /></div>}
            maxWidth="max-w-2xl"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedIds.size > 0 ? `${toFa(selectedIds.size)} مورد انتخاب شده` : 'موردی انتخاب نشده است'}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            انصراف
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedIds.size === 0}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                            افزودن
                        </button>
                    </div>
                </div>
            }
        >
            {scopeNodes.length === 0 ? (
                <EmptyState
                    icon={<TreePine className="w-12 h-12" />}
                    title="درخت مجاز خالی است"
                    description="ابتدا از درخت مرجع، دسته‌بندی‌های مجاز بازار را انتخاب کنید"
                    color="amber"
                />
            ) : (
                <>
                    <div className="mb-3">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder={`جستجوی دسته‌بندی (حداقل ${MIN_SEARCH_CHARS} حرف)...`}
                        />
                        {rawLen > 0 && rawLen < MIN_SEARCH_CHARS && (
                            <p className="text-[11px] text-gray-400 mt-2 text-right">
                                برای فعال شدن جستجو حداقل {toFa(MIN_SEARCH_CHARS)} حرف وارد کنید...
                            </p>
                        )}
                    </div>

                    <div className="max-h-[55vh] overflow-y-auto rounded-xl border-2 border-gray-100 dark:border-gray-700 p-2 bg-gray-50/50 dark:bg-gray-900/30 space-y-1">
                        {filteredNodes.length === 0 ? (
                            <div className="py-10 text-center">
                                <Search className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-sm text-gray-500">نتیجه‌ای یافت نشد</p>
                            </div>
                        ) : (
                            filteredNodes.map((n: any) => {
                                const isUsed = finalUsedIds.has(n.id);
                                const isSelected = selectedIds.has(n.id);
                                const hasKids = (n.children?.length ?? 0) > 0;

                                return (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => toggleSelect(n)}
                                        disabled={isUsed}
                                        className={cn(
                                            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right transition-colors',
                                            isUsed
                                                ? 'opacity-60 cursor-not-allowed bg-emerald-50/50 dark:bg-emerald-900/10'
                                                : isSelected
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/25 ring-2 ring-emerald-300 dark:ring-emerald-700'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50',
                                        )}
                                    >
                                        <div className={cn(
                                            'w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0',
                                            isSelected || isUsed
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'border-gray-300 dark:border-gray-600',
                                        )}>
                                            {(isSelected || isUsed) && <Check className="w-3.5 h-3.5" strokeWidth={3.5} />}
                                        </div>

                                        {hasKids ? (
                                            <div className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                                                <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                        ) : (
                                            <div className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                                                <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{n.title}</div>
                                            {n._parentTitle && (
                                                <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{n._parentTitle}</div>
                                            )}
                                        </div>

                                        {isUsed && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                                                <Check className="w-3 h-3" />
                                                موجود
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </ModalShell>
    );
}

// ============================================================
// مودال ۴: تنظیمات واحد اندازه‌گیری
// ============================================================
// ============================================================
// مودال ۴: تنظیمات واحد اندازه‌گیری (چند واحدی)
// ============================================================
function UnitSettingsModal({ open, onClose, node, units, onSave }: {
    open: boolean;
    onClose: () => void;
    node: TreeNode | null;
    units: any[];
    onSave: (nodeId: string, settings: Partial<TreeNode>) => void;
}) {
    const [modalStep, setModalStep] = useState<1 | 2>(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, 200);

    // ✅ واحد پیش‌فرض
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [selectedUnitTitle, setSelectedUnitTitle] = useState<string>('');
    const [selectedUnitShortCode, setSelectedUnitShortCode] = useState<string>('');
    const [selectedUnitIsVariableQty, setSelectedUnitIsVariableQty] = useState<boolean>(false);
    const [selectedUnitQty, setSelectedUnitQty] = useState<number | ''>('');

    // ✅ واحد اصلی (baseUnit)
    const [baseUnitId, setBaseUnitId] = useState<string>('');
    const [baseUnitTitle, setBaseUnitTitle] = useState<string>('');
    const [baseUnitShortCode, setBaseUnitShortCode] = useState<string>('');

    // ✅ واحدهای فرعی
    const [alternativeUnits, setAlternativeUnits] = useState<any[]>([]);

    // ✅ حداقل/حداکثر
    const [minQuantity, setMinQuantity] = useState<number | null>(null);
    const [maxQuantity, setMaxQuantity] = useState<number | null>(null);

    // ✅ مودال انتخاب واحد
    const [showAllUnitsModal, setShowAllUnitsModal] = useState(false);
    const [unitModalMode, setUnitModalMode] = useState<'primary' | 'base' | 'alternative'>('primary');

    // ✅ مودال افزودن/ویرایش واحد فرعی
    const [showAddAltModal, setShowAddAltModal] = useState(false);
    const [editingAltIndex, setEditingAltIndex] = useState<number | null>(null);
    const [altUnitId, setAltUnitId] = useState('');
    const [altUnitTitle, setAltUnitTitle] = useState('');
    const [altUnitShortCode, setAltUnitShortCode] = useState('');
    const [altUnitIsVariableQty, setAltUnitIsVariableQty] = useState(false);
    const [altUnitQty, setAltUnitQty] = useState<number | ''>('');

    // ✅ لیست واحدهای مرتبط با کتگوری
    const [categoryUnits, setCategoryUnits] = useState<any[]>([]);

    // Initialize from node
    useEffect(() => {
        if (open && node) {
            setSelectedUnitId(node.overrideUnitId || '');
            setSelectedUnitTitle(node.overrideUnitTitle || '');
            setSelectedUnitShortCode(node.overrideUnitShortCode || '');
            setSelectedUnitIsVariableQty(node.overrideUnitIsVariableQty || false);
            setSelectedUnitQty(node.overrideUnitQty ?? '');
            setBaseUnitId(node.baseUnitId || '');
            setBaseUnitTitle(node.baseUnitTitle || '');
            setBaseUnitShortCode(node.baseUnitShortCode || '');
            setAlternativeUnits(node.alternativeUnits || []);
            setMinQuantity(node.minQuantityOverride ?? null);
            setMaxQuantity(node.maxQuantityOverride ?? null);
            setSearch('');
            setModalStep(1);
        }
    }, [open, node]);

    // Fetch category units when opened
    useEffect(() => {
        if (open && node?.categoryId) {
            apiService.admin.categories.getUnits(node.categoryId)
                .then(res => setCategoryUnits(res || []))
                .catch(() => setCategoryUnits([]));
        }
    }, [open, node?.categoryId]);

    const resetAltModal = () => {
        setEditingAltIndex(null);
        setAltUnitId('');
        setAltUnitTitle('');
        setAltUnitShortCode('');
        setAltUnitIsVariableQty(false);
        setAltUnitQty('');
    };

    const searchNorm = normalizeFa(debouncedSearch.trim());
    const isSearching = searchNorm.length >= MIN_SEARCH_CHARS;

    const filteredUnits = useMemo(() => {
        if (!isSearching) return units;
        return units.filter((u: any) =>
            normalizeFa(u.title || '').includes(searchNorm) ||
            normalizeFa(u.shortCode || '').includes(searchNorm),
        );
    }, [units, searchNorm, isSearching]);

    const handleSelectUnit = (unit: any) => {
        if (unitModalMode === 'primary') {
            setSelectedUnitId(unit.id);
            setSelectedUnitTitle(unit.title);
            setSelectedUnitShortCode(unit.shortCode);
            setSelectedUnitIsVariableQty(unit.isVariableQty || false);
            setSelectedUnitQty(unit.isVariableQty ? '' : (unit.conversionFactor || ''));
            setModalStep(2);
        } else if (unitModalMode === 'base') {
            setBaseUnitId(unit.id);
            setBaseUnitTitle(unit.title);
            setBaseUnitShortCode(unit.shortCode);
        } else if (unitModalMode === 'alternative') {
            setAltUnitId(unit.id);
            setAltUnitTitle(unit.title);
            setAltUnitShortCode(unit.shortCode);
            setAltUnitIsVariableQty(unit.isVariableQty || false);
            setAltUnitQty(unit.isVariableQty ? '' : (unit.conversionFactor || ''));
        }
        setShowAllUnitsModal(false);
        setSearch('');
    };

    const handleSave = () => {
        const qty = selectedUnitQty === '' ? null : Number(selectedUnitQty);
        onSave(node!.id, {
            overrideUnitId: selectedUnitId || null,
            overrideUnitTitle: selectedUnitTitle || null,
            overrideUnitShortCode: selectedUnitShortCode || null,
            overrideUnitIsVariableQty: selectedUnitIsVariableQty,
            overrideUnitQty: qty,
            baseUnitId: baseUnitId || null,
            baseUnitTitle: baseUnitTitle || null,
            baseUnitShortCode: baseUnitShortCode || null,
            minQuantityOverride: minQuantity,
            maxQuantityOverride: maxQuantity,
            alternativeUnits: alternativeUnits,
        });
    };

    const handleReset = () => {
        onSave(node!.id, {
            overrideUnitId: null,
            overrideUnitTitle: null,
            overrideUnitShortCode: null,
            overrideUnitIsVariableQty: false,
            overrideUnitQty: null,
            baseUnitId: null,
            baseUnitTitle: null,
            baseUnitShortCode: null,
            minQuantityOverride: null,
            maxQuantityOverride: null,
            alternativeUnits: [],
        });
    };

    const confirmAddAlt = () => {
        if (editingAltIndex !== null) {
            const updated = [...alternativeUnits];
            updated[editingAltIndex] = {
                ...updated[editingAltIndex],
                unitId: altUnitId,
                unitTitle: altUnitTitle,
                unitShortCode: altUnitShortCode,
                isVariableQty: altUnitIsVariableQty,
                qty: altUnitQty === '' ? null : Number(altUnitQty),
            };
            setAlternativeUnits(updated);
        } else {
            if (alternativeUnits.some(au => au.unitId === altUnitId)) {
                toast.info('این واحد قبلاً اضافه شده');
                setShowAddAltModal(false);
                resetAltModal();
                return;
            }
            setAlternativeUnits(prev => [...prev, {
                unitId: altUnitId,
                unitTitle: altUnitTitle,
                unitShortCode: altUnitShortCode,
                minQuantity: null,
                isActive: true,
                displayPriority: prev.length,
                isVariableQty: altUnitIsVariableQty,
                qty: altUnitQty === '' ? null : Number(altUnitQty),
            }]);
        }
        setShowAddAltModal(false);
        resetAltModal();
    };

    if (!node) return null;

    return (
        <>
            <ModalShell
                open={open}
                onClose={onClose}
                title={`تنظیمات واحد — ${node.title}`}
                subtitle="واحد اندازه‌گیری و حداقل سفارش این دسته‌بندی"
                icon={<div className="p-2.5 bg-violet-50 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-400"><Settings className="w-5 h-5" /></div>}
                maxWidth="max-w-lg"
                footer={
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={handleReset}
                            className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            حذف تنظیمات
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!selectedUnitId}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-500 hover:bg-violet-600 text-white shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                                ذخیره
                            </button>
                        </div>
                    </div>
                }
            >
                {/* Step 1: انتخاب واحد پایه + واحد پیش‌فرض */}
                <div className="space-y-4">
                    {/* واحد اصلی */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                            <Ruler className="w-4 h-4 text-blue-500" />
                            واحد اصلی (کوچکترین واحد قابل فروش)
                        </p>
                        {baseUnitTitle ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{baseUnitTitle}</span>
                                <button
                                    onClick={() => { setUnitModalMode('base'); setShowAllUnitsModal(true); }}
                                    className="text-xs text-primary hover:underline"
                                >
                                    تغییر
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setUnitModalMode('base'); setShowAllUnitsModal(true); }}
                                className="w-full text-right px-4 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-primary hover:bg-white dark:hover:bg-gray-800"
                            >
                                + انتخاب واحد اصلی
                            </button>
                        )}
                    </div>

                    {/* واحد پیش‌فرض */}
                    <div className="space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">واحد پیش‌فرض (برای ثبت آگهی):</p>

                        {categoryUnits.length > 0 ? (
                            <div className="space-y-1">
                                {categoryUnits.map((unit: any) => {
                                    const isSelected = selectedUnitId === unit.id;
                                    return (
                                        <button
                                            key={unit.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedUnitId(unit.id);
                                                setSelectedUnitTitle(unit.title);
                                                setSelectedUnitShortCode(unit.shortCode);
                                                setModalStep(2);
                                            }}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-colors',
                                                isSelected
                                                    ? 'bg-violet-50 dark:bg-violet-900/25 ring-2 ring-violet-300 dark:ring-violet-700'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50',
                                            )}
                                        >
                                            <div className={cn(
                                                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                                isSelected ? 'border-violet-500' : 'border-gray-300 dark:border-gray-600',
                                            )}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                                            </div>
                                            <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                                                {unit.title}
                                            </span>
                                            {unit.shortCode && (
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 flex-shrink-0">
                                                    {unit.shortCode}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400">هیچ واحدی برای این گروه تعریف نشده</p>
                        )}

                        <button
                            onClick={() => { setUnitModalMode('primary'); setShowAllUnitsModal(true); }}
                            className="w-full text-right px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl flex items-center justify-between text-sm border border-dashed border-gray-300 dark:border-gray-600"
                        >
                            <span className="font-medium text-primary">جستجو در همه واحدها</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {/* Step 2: تنظیم تعداد و ضریب متغیر */}
                    {modalStep === 2 && selectedUnitId && (
                        <div className="space-y-4 border-t-2 border-gray-100 dark:border-gray-700 pt-4">
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">
                                        تعداد {baseUnitTitle || 'واحد اصلی'} در هر {selectedUnitTitle} (اختیاری)
                                    </label>
                                    <input
                                        type="number"
                                        value={selectedUnitQty}
                                        onChange={(e) => setSelectedUnitQty(e.target.value ? Number(e.target.value) : '')}
                                        placeholder={baseUnitTitle ? `مثلاً 24 (تعداد ${baseUnitTitle} در هر ${selectedUnitTitle})` : 'مثلاً 24'}
                                        className="w-full h-10 px-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="primaryIsVariableQty"
                                        checked={selectedUnitIsVariableQty}
                                        onChange={(e) => setSelectedUnitIsVariableQty(e.target.checked)}
                                        className="w-4 h-4 accent-violet-500"
                                    />
                                    <label htmlFor="primaryIsVariableQty" className="text-xs text-gray-600 dark:text-gray-300">
                                        ضریب متغیر (کاربر می‌تواند تغییر دهد)
                                    </label>
                                </div>
                            </div>

                            {/* حداقل/حداکثر */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">حداقل فروش</label>
                                    <select
                                        value={minQuantity ?? ''}
                                        onChange={(e) => setMinQuantity(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full h-10 px-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                                    >
                                        <option value="">بدون محدودیت</option>
                                        {[1, 10, 100, 1000, 10000].map(v => (
                                            <option key={v} value={v}>{v.toLocaleString('fa-IR')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">حداکثر فروش</label>
                                    <select
                                        value={maxQuantity ?? ''}
                                        onChange={(e) => setMaxQuantity(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full h-10 px-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                                    >
                                        <option value="">بدون محدودیت</option>
                                        {[1, 10, 100, 1000, 10000].map(v => (
                                            <option key={v} value={v}>{v.toLocaleString('fa-IR')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* واحدهای فرعی */}
                    <div className="space-y-2 border-t-2 border-gray-100 dark:border-gray-700 pt-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">واحدهای فرعی (مثلاً جعبه، کارتن، پالت):</p>
                            <button
                                onClick={() => { resetAltModal(); setShowAddAltModal(true); }}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                افزودن واحد
                            </button>
                        </div>

                        {alternativeUnits.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500">واحدی اضافه نشده</p>
                        ) : (
                            <div className="space-y-1.5">
                                {alternativeUnits.map((au: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg px-2.5 py-2">
                                        <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                        <span className="text-xs text-gray-700 dark:text-gray-200 flex-1">{au.unitTitle}</span>

                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {au.isVariableQty ? (
                                                <input
                                                    type="number"
                                                    placeholder="—"
                                                    defaultValue={au.qty || ''}
                                                    onBlur={(e) => {
                                                        const updated = [...alternativeUnits];
                                                        updated[idx] = { ...updated[idx], qty: e.target.value === '' ? null : Number(e.target.value) };
                                                        setAlternativeUnits(updated);
                                                    }}
                                                    className="w-14 h-7 px-1.5 border border-gray-200 dark:border-gray-600 rounded text-[10px] text-center"
                                                />
                                            ) : (
                                                <span className="text-[10px] text-gray-400">= {au.qty || '—'}</span>
                                            )}

                                            <label className="flex items-center gap-0.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={au.isVariableQty || false}
                                                    onChange={(e) => {
                                                        const updated = [...alternativeUnits];
                                                        updated[idx] = { ...updated[idx], isVariableQty: e.target.checked };
                                                        setAlternativeUnits(updated);
                                                    }}
                                                    className="w-3 h-3 accent-violet-500"
                                                />
                                                <span className="text-[9px] text-gray-400">متغیر</span>
                                            </label>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingAltIndex(idx);
                                                setAltUnitId(au.unitId);
                                                setAltUnitTitle(au.unitTitle);
                                                setAltUnitShortCode(au.unitShortCode);
                                                setAltUnitIsVariableQty(au.isVariableQty || false);
                                                setAltUnitQty(au.qty ?? '');
                                                setShowAddAltModal(true);
                                            }}
                                            className="p-0.5 hover:bg-violet-100 dark:hover:bg-violet-800/30 rounded text-gray-400 hover:text-violet-600"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAlternativeUnits(prev => prev.filter((_, i) => i !== idx))}
                                            className="p-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-400 hover:text-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ModalShell>

            {/* مودال جستجوی همه واحدها */}
            {showAllUnitsModal && (
                <ModalShell
                    open={showAllUnitsModal}
                    onClose={() => setShowAllUnitsModal(false)}
                    title={
                        unitModalMode === 'base' ? 'انتخاب واحد اصلی' :
                            unitModalMode === 'alternative' ? 'انتخاب واحد' : 'انتخاب واحد پیش‌فرض'
                    }
                    maxWidth="max-w-sm"
                    footer={null}
                >
                    <div className="relative mb-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجوی واحد..."
                            autoFocus
                            className="w-full h-10 pr-10 pl-10 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="max-h-[45vh] overflow-y-auto space-y-1">
                        {filteredUnits.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400">واحدی یافت نشد</div>
                        ) : (
                            filteredUnits.map((u: any) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => handleSelectUnit(u)}
                                    className="w-full text-right px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl flex items-center justify-between text-sm"
                                >
                                    <span className="font-medium">{u.title}</span>
                                    {u.shortCode && (
                                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{u.shortCode}</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </ModalShell>
            )}

            {/* مودال افزودن/ویرایش واحد فرعی */}
            {showAddAltModal && (
                <ModalShell
                    open={showAddAltModal}
                    onClose={() => { setShowAddAltModal(false); resetAltModal(); }}
                    title={editingAltIndex !== null ? `ویرایش واحد: ${altUnitTitle}` : 'افزودن واحد فرعی'}
                    maxWidth="max-w-md"
                    footer={
                        <div className="flex items-center justify-between gap-3">
                            <button
                                onClick={() => { setAltUnitId(''); setAltUnitTitle(''); }}
                                className="text-xs text-gray-500 hover:text-gray-600 px-3 py-2 rounded-lg"
                            >
                                تغییر واحد
                            </button>
                            <button
                                onClick={confirmAddAlt}
                                disabled={!altUnitId}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-500 hover:bg-violet-600 text-white transition-colors disabled:opacity-50"
                            >
                                {editingAltIndex !== null ? 'ذخیره' : 'افزودن'}
                            </button>
                        </div>
                    }
                >
                    {!altUnitId ? (
                        <>
                            <div className="relative mb-3">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="جستجوی واحد..."
                                    autoFocus
                                    className="w-full h-10 pr-10 pl-10 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {filteredUnits.map((u: any) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => {
                                            setAltUnitId(u.id);
                                            setAltUnitTitle(u.title);
                                            setAltUnitShortCode(u.shortCode);
                                            setAltUnitIsVariableQty(u.isVariableQty || false);
                                            setAltUnitQty(u.isVariableQty ? '' : (u.conversionFactor || ''));
                                        }}
                                        className="w-full text-right px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg flex items-center justify-between text-sm"
                                    >
                                        <span className="font-medium">{u.title}</span>
                                        {u.shortCode && (
                                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{u.shortCode}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 flex items-center gap-2">
                                <Package className="w-4 h-4 text-violet-500" />
                                <span className="text-sm font-semibold">{altUnitTitle}</span>
                                <span className="text-xs text-gray-400">({altUnitShortCode})</span>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">
                                    تعداد {baseUnitTitle || 'واحد اصلی'} در هر {altUnitTitle} (اختیاری)
                                </label>
                                <input
                                    type="number"
                                    value={altUnitQty}
                                    onChange={(e) => setAltUnitQty(e.target.value ? Number(e.target.value) : '')}
                                    placeholder="مثلاً 24"
                                    className="w-full h-10 px-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="altIsVariableQty"
                                    checked={altUnitIsVariableQty}
                                    onChange={(e) => setAltUnitIsVariableQty(e.target.checked)}
                                    className="w-4 h-4 accent-violet-500"
                                />
                                <label htmlFor="altIsVariableQty" className="text-xs text-gray-600 dark:text-gray-300">
                                    ضریب متغیر (کاربر می‌تواند تغییر دهد)
                                </label>
                            </div>
                        </div>
                    )}
                </ModalShell>
            )}
        </>
    );
}

// ============================================================
// مودال ۵: تأیید حذف
// ============================================================
function DeleteConfirmModal({ open, data, descendantCount, onClose, onConfirm }: {
    open: boolean;
    data: DeleteConfirmData | null;
    descendantCount: number;
    onClose: () => void;
    onConfirm: (nodeId: string, tree: 'scope' | 'final') => void;
}) {
    if (!data) return null;

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title="حذف دسته‌بندی"
            icon={<div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-500"><Trash2 className="w-5 h-5" /></div>}
            maxWidth="max-w-md"
            footer={
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={() => onConfirm(data.nodeId, data.tree)}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        حذف قطعی
                    </button>
                </div>
            }
        >
            <div className="text-center py-2">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    آیا از حذف <span className="font-bold">«{data.title}»</span> مطمئن هستید؟
                </p>
                {descendantCount > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-2 justify-center">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {toFa(descendantCount)} زیرمجموعه این نود نیز حذف خواهند شد
                    </div>
                )}
                {data.tree === 'final' && (
                    <p className="mt-2 text-[11px] text-gray-400">
                        این عملیات ساختار نمایشی درخت نهایی بازار را تغییر می‌دهد
                    </p>
                )}
            </div>
        </ModalShell>
    );
}

// ============================================================
// کامپوننت اصلی
// ============================================================
export function ArmCategoryManager({ onSave, isAdmin = false }: ArmCategoryManagerProps) {
    const { setValue } = useFormContext();

    const { data: allCategories = [], isLoading: isCategoriesLoading } = useCategoriesFlat();
    const { data: allUnitsList = [] } = useUnits();

    const formAllowedCategoryScopeTree = useWatch({ name: 'allowedCategoryScopeTree' }) || [];
    const formCategoryTree = useWatch({ name: 'categoryTree' }) || [];
    const armAdminPermission = useWatch({ name: 'config.armAdminPermission' }) || {};

    const categoriesAccess = armAdminPermission.categories || {};
    const canAdd = isAdmin || categoriesAccess.canAdd === true;
    const canRemove = isAdmin || categoriesAccess.canRemove === true;

    // ─────────── State ───────────
    const [mobileTab, setMobileTab] = useState<'scope' | 'final'>('scope');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const [showReferencePicker, setShowReferencePicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [pickerParentId, setPickerParentId] = useState<string | null>(null);

    // ✅ مودال افزودن سریع (سناریوی پفک/چیپس)
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddParentId, setQuickAddParentId] = useState<string | null>(null);

    const [showUnitSettings, setShowUnitSettings] = useState(false);
    const [unitSettingsNodeId, setUnitSettingsNodeId] = useState<string | null>(null);

    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmData | null>(null);

    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
    const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | 'inside' | null>(null);

    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState('');
    const [editingTree, setEditingTree] = useState<'scope' | 'final'>('final');

    // ✅ جستجوی اصلی: دیبانس + حداقل ۲ حرف
    const debouncedSearchTerm = useDebouncedValue(searchTerm, MAIN_SEARCH_DEBOUNCE_MS);
    const isMainSearchActive = normalizeFa(debouncedSearchTerm.trim()).length >= MIN_SEARCH_CHARS;
    const mainSearchRawLen = normalizeFa(searchTerm.trim()).length;

    // ─────────── Computed ───────────
    const allowedCategoryScopeTree = useMemo(
        () => (Array.isArray(formAllowedCategoryScopeTree) ? formAllowedCategoryScopeTree : []),
        [formAllowedCategoryScopeTree],
    );

    const categoryTree = useMemo(
        () => (Array.isArray(formCategoryTree) ? formCategoryTree : []),
        [formCategoryTree],
    );

    const referenceChildrenMap = useMemo(() => buildChildrenMap(allCategories), [allCategories]);

    const scopeTreeIds = useMemo(() => collectTreeIds(allowedCategoryScopeTree), [allowedCategoryScopeTree]);

    const finalTreeIds = useMemo(() => {
        const ids = new Set<string>();
        const collect = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                ids.add(node.categoryId || node.id);
                if (node.children) collect(node.children);
            }
        };
        collect(categoryTree);
        return ids;
    }, [categoryTree]);

    const scopeLeafCount = useMemo(() => {
        let count = 0;
        const countLeaves = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                if ((node.children?.length ?? 0) === 0) count++;
                if (node.children) countLeaves(node.children);
            }
        };
        countLeaves(allowedCategoryScopeTree);
        return count;
    }, [allowedCategoryScopeTree]);

    const finalLeafCount = useMemo(() => {
        let count = 0;
        const countLeaves = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                if (node.isLeaf) count++;
                if (node.children) countLeaves(node.children);
            }
        };
        countLeaves(categoryTree);
        return count;
    }, [categoryTree]);

    const filteredScopeTree = useMemo(() => {
        if (!isMainSearchActive) return allowedCategoryScopeTree;
        return filterTreeBySearch(allowedCategoryScopeTree, debouncedSearchTerm);
    }, [allowedCategoryScopeTree, debouncedSearchTerm, isMainSearchActive]);

    const filteredFinalTree = useMemo(() => {
        if (!isMainSearchActive) return categoryTree;
        return filterTreeBySearch(categoryTree, debouncedSearchTerm);
    }, [categoryTree, debouncedSearchTerm, isMainSearchActive]);

    // باز شدن خودکار نتایج هنگام جستجو
    useEffect(() => {
        if (!isMainSearchActive) return;
        setExpandedNodes(prev => {
            const next = new Set(prev);
            const collect = (nodes: TreeNode[]) => {
                for (const n of nodes) {
                    next.add(n.id);
                    if (n.children && n.children.length > 0) collect(n.children);
                }
            };
            collect(filteredScopeTree);
            collect(filteredFinalTree);
            return next;
        });
    }, [isMainSearchActive, filteredScopeTree, filteredFinalTree]);

    // نودهای هدف مودال‌ها
    const quickAddParentNode = useMemo(
        () => (quickAddParentId ? findNodeInTree(allowedCategoryScopeTree, quickAddParentId) : null),
        [quickAddParentId, allowedCategoryScopeTree],
    );

    const unitSettingsNode = useMemo(
        () => (unitSettingsNodeId ? findNodeInTree(categoryTree, unitSettingsNodeId) : null),
        [unitSettingsNodeId, categoryTree],
    );

    const deleteDescendantCount = useMemo(() => {
        if (!deleteConfirm) return 0;
        const source = deleteConfirm.tree === 'final' ? categoryTree : allowedCategoryScopeTree;
        const node = findNodeInTree(source, deleteConfirm.nodeId);
        return node ? getAllDescendantIds(node).length : 0;
    }, [deleteConfirm, categoryTree, allowedCategoryScopeTree]);

    // ─────────── Scope Tree Actions ───────────
    const saveScopeTree = useCallback((newTree: TreeNode[]) => {
        setValue('allowedCategoryScopeTree', newTree, { shouldDirty: true });
        if (onSave) onSave();
    }, [setValue, onSave]);

    const handleReferencePickerConfirm = useCallback((newTree: TreeNode[]) => {
        saveScopeTree(newTree);
        setShowReferencePicker(false);
        toast.success('درخت مجاز به‌روزرسانی شد');
    }, [saveScopeTree]);

    // ✅ تأیید افزودن سریع (مودال چیپس)
    const handleQuickAddConfirm = useCallback((newTree: TreeNode[], addedCount: number) => {
        saveScopeTree(newTree);
        setShowQuickAdd(false);
        if (quickAddParentId) {
            setExpandedNodes(prev => new Set([...prev, quickAddParentId]));
        }
        setQuickAddParentId(null);
        toast.success(`${toFa(addedCount)} مورد به درخت مجاز اضافه شد`);
    }, [saveScopeTree, quickAddParentId]);

    const handleRemoveFromScope = useCallback((nodeId: string) => {
        let newTree = removeNodeFromTree(allowedCategoryScopeTree, nodeId);
        newTree = removeEmptyFolders(newTree, referenceChildrenMap);
        saveScopeTree(newTree);
        toast.success('حذف شد');
    }, [allowedCategoryScopeTree, saveScopeTree, referenceChildrenMap]);

    // ─────────── Final Tree Actions ───────────
    const saveFinalTree = useCallback((newTree: TreeNode[]) => {
        setValue('categoryTree', newTree, { shouldDirty: true });
        if (onSave) onSave();
    }, [setValue, onSave]);

    const handleAddToFinal = useCallback((leaf: TreeNode) => {
        if (finalTreeIds.has(leaf.id)) return;
        const leafNode: TreeNode = { id: leaf.id, title: leaf.title, categoryId: leaf.id, isLeaf: true };
        saveFinalTree([...categoryTree, leafNode]);
        toast.success('دسته‌بندی اضافه شد');
    }, [categoryTree, finalTreeIds, saveFinalTree]);

    const handleAddGroup = useCallback((parentId: string | null) => {
        const newNode: TreeNode = {
            id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: 'گروه جدید',
            children: [],
            isLeaf: false,
        };
        const newTree = addNodeToTree(categoryTree, parentId, newNode);
        saveFinalTree(newTree);
        if (parentId) setExpandedNodes(prev => new Set([...prev, parentId]));
        setEditingNodeId(newNode.id);
        setEditingLabel('گروه جدید');
        setEditingTree('final');
    }, [categoryTree, saveFinalTree]);

    const handleConfirmCategoryPicker = useCallback((categories: TreeNode[]) => {
        if (categories.length === 0) {
            setShowCategoryPicker(false);
            setPickerParentId(null);
            return;
        }
        let newTree = categoryTree;
        for (const cat of categories) {
            const leafNode: TreeNode = { id: cat.id, title: cat.title, categoryId: cat.id, isLeaf: true };
            newTree = addNodeToTree(newTree, pickerParentId, leafNode);
        }
        saveFinalTree(newTree);
        if (pickerParentId) setExpandedNodes(prev => new Set([...prev, pickerParentId]));
        setShowCategoryPicker(false);
        setPickerParentId(null);
        toast.success(`${toFa(categories.length)} دسته‌بندی اضافه شد`);
    }, [categoryTree, pickerParentId, saveFinalTree]);

    const handleRemoveFromFinal = useCallback((nodeId: string) => {
        const newTree = removeNodeFromTree(categoryTree, nodeId);
        saveFinalTree(newTree);
        toast.success('حذف شد');
    }, [categoryTree, saveFinalTree]);

    const handleSaveLabel = useCallback((nodeId: string) => {
        const value = editingLabel.trim();
        if (!value) return;
        const sourceTree = editingTree === 'final' ? categoryTree : allowedCategoryScopeTree;
        const newTree = updateNodeInTree(sourceTree, nodeId, { title: value });
        if (editingTree === 'final') saveFinalTree(newTree);
        else saveScopeTree(newTree);
        setEditingNodeId(null);
        setEditingLabel('');
        toast.success('عنوان ذخیره شد');
    }, [editingLabel, editingTree, categoryTree, allowedCategoryScopeTree, saveFinalTree, saveScopeTree]);

    const saveUnitSettings = useCallback((nodeId: string, settings: Partial<TreeNode>) => {
        const newTree = updateNodeInTree(categoryTree, nodeId, settings);
        saveFinalTree(newTree);
        setShowUnitSettings(false);
        setUnitSettingsNodeId(null);
        toast.success('تنظیمات واحد ذخیره شد');
    }, [categoryTree, saveFinalTree]);

    // ─────────── Drag & Drop (با رفع باگ حذف بچه‌ها) ───────────
    const insertNodeAtPosition = useCallback((
        nodes: TreeNode[],
        targetId: string,
        draggedNode: TreeNode,
        position: 'before' | 'after' | 'inside',
    ): TreeNode[] => {
        const result: TreeNode[] = [];
        for (const node of nodes) {
            if (node.id === targetId) {
                if (position === 'before') {
                    // ✅ نود با تمام بچه‌ها و نوه‌هایش جابجا می‌شود (قبلاً children: [] بود!)
                    result.push(draggedNode);
                    result.push(node);
                } else if (position === 'after') {
                    result.push(node);
                    result.push(draggedNode);
                } else {
                    result.push({ ...node, children: [...(node.children || []), draggedNode] });
                }
            } else {
                result.push({
                    ...node,
                    children: node.children ? insertNodeAtPosition(node.children, targetId, draggedNode, position) : [],
                });
            }
        }
        return result;
    }, []);

    const isInSubtree = useCallback((ancestorId: string, candidateId: string): boolean => {
        const ancestor = findNodeInTree(categoryTree, ancestorId);
        if (!ancestor) return false;
        return !!findNodeInTree(ancestor.children || [], candidateId);
    }, [categoryTree]);

    const handleDragStart = (e: React.DragEvent, nodeId: string) => {
        setDraggedNodeId(nodeId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', nodeId);
    };

    const handleDragEnd = () => {
        setDraggedNodeId(null);
        setDragOverNodeId(null);
        setDragOverPosition(null);
    };

    const handleDragOver = (e: React.DragEvent, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedNodeId || draggedNodeId === nodeId) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        let position: 'before' | 'after' | 'inside';
        if (y < height * 0.25) position = 'before';
        else if (y > height * 0.75) position = 'after';
        else position = 'inside';
        setDragOverNodeId(nodeId);
        setDragOverPosition(position);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedNodeId || draggedNodeId === targetId || !dragOverPosition) return;

        // ✅ جلوگیری از انداختن گروه داخل زیرمجموعه خودش
        if (dragOverPosition === 'inside' && isInSubtree(draggedNodeId, targetId)) {
            toast.error('نمی‌توانید یک گروه را داخل زیرمجموعه خودش قرار دهید');
            handleDragEnd();
            return;
        }

        const draggedNode = findNodeInTree(categoryTree, draggedNodeId);
        if (!draggedNode) return;

        // ✅ کپی عمیق برای جلوگیری از تداخل رفرنس
        const nodeCopy: TreeNode = JSON.parse(JSON.stringify(draggedNode));
        let newTree = removeNodeFromTree(categoryTree, draggedNodeId);
        newTree = insertNodeAtPosition(newTree, targetId, nodeCopy, dragOverPosition);
        saveFinalTree(newTree);
        handleDragEnd();
        toast.success('جابجا شد');
    };

    // ─────────── Misc ───────────
    const toggleNode = (nodeId: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    };

    const openQuickAdd = useCallback((nodeId: string) => {
        setQuickAddParentId(nodeId);
        setShowQuickAdd(true);
    }, []);

    // ============================================================
    // Render Scope Node (درخت مجاز)
    // ============================================================
    const renderScopeNode = (node: TreeNode, depth: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isLeaf = !hasChildren;
        const isAdded = isLeaf && finalTreeIds.has(node.id);
        const isEditing = editingNodeId === node.id && editingTree === 'scope';

        // ✅ نودهایی که در مرجع بچه دارند → دکمه افزودن سریع
        const refChildCount = (referenceChildrenMap.get(node.id) || []).length;
        const canQuickAdd = canAdd && refChildCount > 0;

        return (
            <div key={node.id} className="group/node">
                <div
                    className={cn(
                        'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200',
                        'hover:bg-gradient-to-r hover:from-amber-50/80 hover:to-transparent dark:hover:from-amber-900/20',
                        isEditing && 'bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-200 dark:ring-amber-800',
                    )}
                    style={{ paddingRight: depth * 16 + 8 }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => toggleNode(node.id)}
                            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-lg transition-colors flex-shrink-0"
                        >
                            <div className={cn('transition-transform duration-200', !isExpanded ? 'rotate-0' : '-rotate-90')}>
                                <ChevronLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </button>
                    ) : (
                        <div className="w-6 flex-shrink-0" />
                    )}

                    {isLeaf ? (
                        <div className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    ) : (
                        <div className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                    )}

                    {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                                type="text"
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                onBlur={() => handleSaveLabel(node.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); handleSaveLabel(node.id); }
                                    if (e.key === 'Escape') { e.preventDefault(); setEditingNodeId(null); }
                                }}
                                autoFocus
                                className="flex-1 min-w-0 h-8 px-3 border-2 border-amber-300 dark:border-amber-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-200 outline-none"
                            />
                            <button onClick={() => handleSaveLabel(node.id)} className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded-lg text-emerald-600">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingNodeId(null)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-lg text-red-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <span className="flex-1 min-w-0 text-right text-sm font-medium truncate">{node.title}</span>
                    )}

                    {/* ✅ دکمه افزودن سریع زیرمجموعه‌ها (ویژگی جدید) */}
                    {canQuickAdd && !isEditing && (
                        <button
                            type="button"
                            onClick={() => openQuickAdd(node.id)}
                            className="flex items-center gap-1 p-1.5 sm:px-2 rounded-lg bg-amber-100/80 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors flex-shrink-0"
                            title={`افزودن سریع زیرمجموعه‌های «${node.title}» بدون مراجعه به درخت مرجع`}
                        >
                            <ListPlus className="w-4 h-4" />
                           {/* <span className="hidden md:inline text-[10px] font-bold">زیرمجموعه</span>*/}
                        </button>
                    )}

                    {isLeaf && (
                        isAdded ? (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                                <Check className="w-3 h-3" />
                                فعال
                            </span>
                        ) : canAdd ? (
                            <button
                                type="button"
                                onClick={() => handleAddToFinal(node)}
                                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 opacity-0 group-hover/node:opacity-100 transition-all duration-200 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:shadow-sm"
                            >
                                <Plus className="w-3 h-3" />
                                افزودن
                            </button>
                        ) : null
                    )}

                    {isLeaf && !isAdded && canAdd && (
                        <button
                            type="button"
                            onClick={() => handleAddToFinal(node)}
                            className="sm:hidden p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded-lg text-emerald-600 flex-shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}

                    {canAdd && !isEditing && (
                        <button
                            type="button"
                            onClick={() => { setEditingNodeId(node.id); setEditingLabel(node.title); setEditingTree('scope'); }}
                            className="hidden sm:block p-1.5 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-lg text-gray-400 hover:text-amber-600 transition-colors opacity-0 group-hover/node:opacity-100 flex-shrink-0"
                            title="ویرایش عنوان"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {canRemove && (
                        <button
                            type="button"
                            onClick={() => setDeleteConfirm({ nodeId: node.id, title: node.title, tree: 'scope' })}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 hover:text-red-600 transition-colors flex-shrink-0 sm:opacity-0 sm:group-hover/node:opacity-100"
                            title="حذف"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div className="mr-3 sm:mr-4 border-r-2 border-amber-100 dark:border-amber-800/30 rounded-r-lg overflow-hidden">
                        {node.children!.map(child => renderScopeNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // ============================================================
    // Render Final Node (درخت نهایی)
    // ============================================================
    const renderFinalNode = (node: TreeNode, depth: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isEditing = editingNodeId === node.id && editingTree === 'final';
        const isDragging = draggedNodeId === node.id;
        const isDragOver = dragOverNodeId === node.id;

        // ✅ واحدهای فرعی
        const alternativeUnits = node.alternativeUnits || [];
        const baseUnitTitle = node.baseUnitTitle || 'واحد';

        return (
            <div key={node.id} className="group/node">
                <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, node.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, node.id)}
                    onDrop={(e) => handleDrop(e, node.id)}
                    className={cn(
                        'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200 border-2',
                        isDragging && 'opacity-40 border-dashed border-primary',
                        isDragOver && dragOverPosition === 'inside' && 'border-primary bg-primary/5',
                        isDragOver && dragOverPosition === 'before' && 'border-t-4 border-t-primary border-x-transparent border-b-transparent',
                        isDragOver && dragOverPosition === 'after' && 'border-b-4 border-b-primary border-x-transparent border-t-transparent',
                        !isDragging && !isDragOver && !isEditing && 'border-transparent hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-transparent dark:hover:from-blue-900/20',
                        isEditing && 'border-primary/50 bg-blue-50/50 dark:bg-blue-900/20',
                    )}
                    style={{ paddingRight: depth * 16 + 8 }}
                >
                    <div className="hidden sm:block cursor-grab active:cursor-grabbing flex-shrink-0">
                        <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    </div>

                    {hasChildren || !node.isLeaf ? (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors flex-shrink-0"
                        >
                            <div className={cn('transition-transform duration-200', !isExpanded ? 'rotate-0' : '-rotate-90')}>
                                <ChevronLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </button>
                    ) : (
                        <div className="w-6 flex-shrink-0" />
                    )}

                    {node.isLeaf ? (
                        <div className="p-1 bg-primary/10 rounded-lg flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-primary" />
                        </div>
                    ) : isExpanded ? (
                        <div className="p-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                            <FolderOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                    ) : (
                        <div className="p-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                            <Folder className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                    )}

                    {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                                type="text"
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                onBlur={() => handleSaveLabel(node.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); handleSaveLabel(node.id); }
                                    if (e.key === 'Escape') { e.preventDefault(); setEditingNodeId(null); }
                                }}
                                autoFocus
                                className="flex-1 min-w-0 h-8 px-3 border-2 border-primary/50 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <button onClick={() => handleSaveLabel(node.id)} className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded-lg text-emerald-600">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingNodeId(null)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-lg text-red-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 min-w-0">
                                <span className="block text-right text-sm font-medium truncate">{node.title}</span>

                                {/* ✅ نمایش اطلاعات واحدها زیر عنوان */}
                                {node.isLeaf && !isEditing && (
                                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                        {/* ✅ واحد اصلی */}
                                        {baseUnitTitle && node.baseUnitTitle && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <Ruler className="w-2.5 h-2.5" />
                                                {node.baseUnitTitle}
                                        </span>
                                        )}

                                        {/* ✅ واحد پیش‌فرض با ستاره */}
                                        {node.overrideUnitTitle && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                                            <Star className="w-2.5 h-2.5 fill-violet-500" />
                                                {node.overrideUnitTitle}
                                                {node.overrideUnitQty != null && (
                                                    <span className="font-normal text-violet-400">
                                                    = {node.overrideUnitQty} {node.baseUnitTitle || 'واحد'}
                                                </span>
                                                )}
                                        </span>
                                        )}

                                        {/* ✅ واحدهای فرعی */}
                                        {alternativeUnits.map((au: any, idx: number) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-gray-50 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400"
                                            >
                                            <Package className="w-2.5 h-2.5" />
                                                {au.unitTitle}
                                                {au.qty != null && (
                                                    <span className="text-gray-400">
                                                    = {au.qty} {node.baseUnitTitle || 'واحد'}
                                                </span>
                                                )}
                                                {au.isVariableQty && (
                                                    <span className="text-[8px] text-amber-500" title="قابل تغییر توسط کاربر">🔧</span>
                                                )}
                                        </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ✅ بج واحد پیش‌فرض در سمت راست (وقتی ویرایش نیست) */}
                    {node.isLeaf && node.overrideUnitTitle && !isEditing && (
                        <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex-shrink-0">
                        {node.overrideUnitTitle}
                    </span>
                    )}

                    {/* ✅ بج تعداد واحدهای فرعی */}
                    {node.isLeaf && alternativeUnits.length > 0 && !isEditing && (
                        <span className="hidden sm:inline-flex text-[9px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex-shrink-0">
                        +{alternativeUnits.length}
                    </span>
                    )}

                    <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => { setEditingNodeId(node.id); setEditingLabel(node.title); setEditingTree('final'); }}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                            title="ویرایش عنوان"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {node.isLeaf && (
                            <button
                                type="button"
                                onClick={() => { setUnitSettingsNodeId(node.id); setShowUnitSettings(true); }}
                                className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-800/30 rounded-lg text-gray-400 hover:text-violet-600 transition-colors"
                                title="تنظیمات واحد"
                            >
                                <Settings className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {!node.isLeaf && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleAddGroup(node.id)}
                                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                    title="افزودن زیرگروه"
                                >
                                    <FolderPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setPickerParentId(node.id); setShowCategoryPicker(true); }}
                                    className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
                                    title="افزودن دسته‌بندی"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => setDeleteConfirm({ nodeId: node.id, title: node.title, tree: 'final' })}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            title="حذف"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="mr-3 sm:mr-6 border-r-2 border-blue-100 dark:border-blue-800/30 rounded-r-lg overflow-hidden">
                        {node.children!.map(child => renderFinalNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // ============================================================
    // Loading State
    // ============================================================
    if (isCategoriesLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
                        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    // ============================================================
    // Main Render
    // ============================================================
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<TreePine className="w-5 h-5" />} label="دسته‌بندی مرجع" value={toFa(allCategories.length)} color="amber" />
                <StatCard icon={<Layers className="w-5 h-5" />} label="مجاز بازار" value={toFa(scopeTreeIds.size)} color="orange" />
                <StatCard icon={<ShoppingCart className="w-5 h-5" />} label="برگ نهایی" value={toFa(finalLeafCount)} color="emerald" />
                <StatCard
                    icon={<Sparkles className="w-5 h-5" />}
                    label="پوشش دهی"
                    value={`${scopeLeafCount > 0 ? Math.round((finalLeafCount / scopeLeafCount) * 100) : 0}%`}
                    color="blue"
                />
            </div>

            {/* ✅ Search Bar (دیبانس + حداقل ۲ حرف + دکمه پاک کردن) */}
            <div>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="جستجو در دسته‌بندی‌ها..."
                        className="w-full h-12 pr-11 pl-11 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            title="پاک کردن جستجو"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {mainSearchRawLen > 0 && mainSearchRawLen < MIN_SEARCH_CHARS && (
                    <p className="text-[11px] text-gray-400 mt-1.5 text-right">
                        برای فعال شدن جستجو حداقل {toFa(MIN_SEARCH_CHARS)} حرف وارد کنید...
                    </p>
                )}
            </div>

            {/* Mobile Tabs */}
            <div className="sm:hidden flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
                <button
                    onClick={() => setMobileTab('scope')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                        mobileTab === 'scope' ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-gray-500',
                    )}
                >
                    <Layers className="w-4 h-4" />
                    مجاز بازار
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30">{toFa(scopeTreeIds.size)}</span>
                </button>
                <button
                    onClick={() => setMobileTab('final')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                        mobileTab === 'final' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500',
                    )}
                >
                    <ShoppingCart className="w-4 h-4" />
                    درخت نهایی
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30">{toFa(finalLeafCount)}</span>
                </button>
            </div>

            {/* Desktop: Two Panels */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-4 lg:gap-6">
                {/* Scope Tree Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                    <PanelHeader
                        icon={<Layers className="w-5 h-5" />}
                        title="گروه‌های مجاز بازار"
                        subtitle="انتخاب از درخت مرجع"
                        count={scopeTreeIds.size}
                        color="amber"
                    >
                        {canAdd && (
                            <button
                                onClick={() => setShowReferencePicker(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                افزودن از مرجع
                            </button>
                        )}
                    </PanelHeader>
                    <div className="max-h-[500px] overflow-y-auto p-3">
                        {filteredScopeTree.length === 0 ? (
                            <EmptyState
                                icon={<TreePine className="w-12 h-12" />}
                                title={isMainSearchActive ? 'نتیجه‌ای یافت نشد' : 'هیچ گروهی انتخاب نشده'}
                                description={isMainSearchActive ? 'عبارت جستجو را تغییر دهید' : 'از درخت مرجع دسته‌بندی‌های مجاز را انتخاب کنید'}
                                action={canAdd && !isMainSearchActive ? {
                                    label: 'انتخاب از مرجع',
                                    onClick: () => setShowReferencePicker(true),
                                } : undefined}
                                color="amber"
                            />
                        ) : (
                            <div className="space-y-1">
                                {filteredScopeTree.map(node => renderScopeNode(node))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Final Tree Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                    <PanelHeader
                        icon={<ShoppingCart className="w-5 h-5" />}
                        title="درخت دسته‌بندی نهایی"
                        subtitle="ساختار نمایش به کاربر"
                        count={finalLeafCount}
                        color="blue"
                    >
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleAddGroup(null)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                <FolderPlus className="w-4 h-4" />
                                گروه جدید
                            </button>
                            <button
                                onClick={() => { setPickerParentId(null); setShowCategoryPicker(true); }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                دسته‌بندی
                            </button>
                        </div>
                    </PanelHeader>
                    <div className="max-h-[500px] overflow-y-auto p-3">
                        {filteredFinalTree.length === 0 ? (
                            <EmptyState
                                icon={<ShoppingCart className="w-12 h-12" />}
                                title={isMainSearchActive ? 'نتیجه‌ای یافت نشد' : 'درخت نهایی خالی است'}
                                description={isMainSearchActive ? 'عبارت جستجو را تغییر دهید' : 'گروه‌ها و دسته‌بندی‌ها را ایجاد کنید'}
                                action={!isMainSearchActive ? {
                                    label: 'ایجاد گروه جدید',
                                    onClick: () => handleAddGroup(null),
                                } : undefined}
                                color="blue"
                            />
                        ) : (
                            <div className="space-y-1">
                                {filteredFinalTree.map(node => renderFinalNode(node))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile: Single Panel */}
            <div className="sm:hidden bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                {mobileTab === 'scope' ? (
                    <>
                        <PanelHeader
                            icon={<Layers className="w-5 h-5" />}
                            title="گروه‌های مجاز"
                            count={scopeTreeIds.size}
                            color="amber"
                        >
                            {canAdd && (
                                <button
                                    onClick={() => setShowReferencePicker(true)}
                                    className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </PanelHeader>
                        <div className="max-h-[60vh] overflow-y-auto p-3">
                            {filteredScopeTree.length === 0 ? (
                                <EmptyState
                                    icon={<TreePine className="w-10 h-10" />}
                                    title="خالی است"
                                    description="از مرجع انتخاب کنید"
                                    action={canAdd ? { label: 'انتخاب', onClick: () => setShowReferencePicker(true) } : undefined}
                                    color="amber"
                                    compact
                                />
                            ) : (
                                <div className="space-y-1">
                                    {filteredScopeTree.map(node => renderScopeNode(node))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <PanelHeader
                            icon={<ShoppingCart className="w-5 h-5" />}
                            title="درخت نهایی"
                            count={finalLeafCount}
                            color="blue"
                        >
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => handleAddGroup(null)} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                    <FolderPlus className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => { setPickerParentId(null); setShowCategoryPicker(true); }}
                                    className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </PanelHeader>
                        <div className="max-h-[60vh] overflow-y-auto p-3">
                            {filteredFinalTree.length === 0 ? (
                                <EmptyState
                                    icon={<ShoppingCart className="w-10 h-10" />}
                                    title="خالی است"
                                    description="گروه‌ها و دسته‌بندی‌ها را ایجاد کنید"
                                    color="blue"
                                    compact
                                />
                            ) : (
                                <div className="space-y-1">
                                    {filteredFinalTree.map(node => renderFinalNode(node))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ═══════════ Modals ═══════════ */}
            <ReferencePickerModal
                open={showReferencePicker}
                onClose={() => setShowReferencePicker(false)}
                allCategories={allCategories}
                currentScopeTree={allowedCategoryScopeTree}
                onConfirm={handleReferencePickerConfirm}
            />

            <QuickAddChildrenModal
                open={showQuickAdd}
                onClose={() => { setShowQuickAdd(false); setQuickAddParentId(null); }}
                parentNode={quickAddParentNode}
                allCategories={allCategories}
                currentScopeTree={allowedCategoryScopeTree}
                onConfirm={handleQuickAddConfirm}
            />

            <CategoryPickerModal
                open={showCategoryPicker}
                onClose={() => { setShowCategoryPicker(false); setPickerParentId(null); }}
                scopeTree={allowedCategoryScopeTree}
                finalUsedIds={finalTreeIds}
                onConfirm={handleConfirmCategoryPicker}
            />

            <UnitSettingsModal
                open={showUnitSettings}
                onClose={() => { setShowUnitSettings(false); setUnitSettingsNodeId(null); }}
                node={unitSettingsNode}
                units={allUnitsList}
                onSave={saveUnitSettings}
            />

            <DeleteConfirmModal
                open={!!deleteConfirm}
                data={deleteConfirm}
                descendantCount={deleteDescendantCount}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={(nodeId, tree) => {
                    if (tree === 'final') handleRemoveFromFinal(nodeId);
                    else handleRemoveFromScope(nodeId);
                    setDeleteConfirm(null);
                }}
            />
        </div>
    );
}