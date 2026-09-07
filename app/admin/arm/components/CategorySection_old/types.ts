// app/admin/arm/components/CategorySection/types.ts

export interface TreeNode {
    id: string;
    title: string;
    categoryId?: string;
    parentId?: string | null;
    children?: TreeNode[];
    isLeaf?: boolean;
    overrideUnitId?: string;
    overrideUnitTitle?: string;
    overrideUnitShortCode?: string;
    overrideUnitIsVariableQty?: boolean;
    overrideUnitQty?: number | null;
    minQuantityOverride?: number | null;
    maxQuantityOverride?: number | null;
    baseUnitId?: string | null;
    baseUnitTitle?: string | null;
    baseUnitShortCode?: string | null;
    alternativeUnits?: any[];
    customLabel?: string | null;
    example?: string | null;
    path?: string;
    level?: number;
    [key: string]: any;
}

export type CheckState = 'checked' | 'indeterminate' | 'unchecked';

export interface DeleteConfirmData {
    nodeId: string;
    title: string;
    tree: 'scope' | 'final';
}