// app/ad/form/tree-utils.ts
// ✅ توابع خالص درخت دسته‌بندی — بدون وابستگی به React، قابل تست

import type { UnitOption } from './types';

export function findNodeInTree(nodes: any[], id: string): any {
    for (const n of nodes) {
        if (n.id === id || n.categoryId === id) return n;
        if (n.children) { const f = findNodeInTree(n.children, id); if (f) return f; }
    }
    return null;
}

export function getAvailableUnits(categoryId: string, categoryTree: any[]): UnitOption[] {
    const node = findNodeInTree(categoryTree, categoryId);
    if (!node) return [];
    const units: UnitOption[] = [];
    if (node.overrideUnitId) {
        units.push({
            unitId: node.overrideUnitId, unitTitle: node.overrideUnitTitle || '',
            unitShortCode: node.overrideUnitShortCode || node.overrideUnitTitle || '',
            isVariableQty: node.overrideUnitIsVariableQty === true,
            qty: node.overrideUnitQty ?? null, isDefault: true,
        });
    }
    (node.alternativeUnits || []).forEach((au: any) => {
        if (au.unitId && au.isActive !== false) {
            units.push({
                unitId: au.unitId, unitTitle: au.unitTitle || '', unitShortCode: au.unitShortCode || au.unitTitle || '',
                isVariableQty: au.isVariableQty === true, qty: au.qty ?? null, isDefault: false,
            });
        }
    });
    return units;
}

export function getCategoryConstraints(categoryId: string, categoryTree: any[]) {
    const node = findNodeInTree(categoryTree, categoryId);
    return { min: node?.minQuantityOverride ?? null, max: node?.maxQuantityOverride ?? null };
}
