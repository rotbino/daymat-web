// app/admin/arm/components/CategorySection/utils.ts

import { useEffect, useState } from 'react';
import type { TreeNode, CheckState } from './types';

export const MIN_SEARCH_CHARS = 2;
export const SEARCH_DEBOUNCE_MS = 300;
export const MAIN_SEARCH_DEBOUNCE_MS = 200;

export function toFa(n: number): string {
    return new Intl.NumberFormat('fa-IR').format(n);
}

export function normalizeFa(input: string): string {
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

export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export function removeEmptyFolders(nodes: TreeNode[], childrenMap?: Map<string, any[]>): TreeNode[] {
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
            if (childrenMap) {
                return (childrenMap.get(node.id)?.length ?? 0) === 0;
            }
            return false;
        });
}

export function removeNodeFromTree(nodes: TreeNode[], nodeId: string): TreeNode[] {
    return nodes
        .filter(node => node.id !== nodeId)
        .map(node => ({
            ...node,
            children: node.children ? removeNodeFromTree(node.children, nodeId) : [],
        }));
}

export function addNodeToTree(nodes: TreeNode[], parentId: string | null, newNode: TreeNode): TreeNode[] {
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

export function updateNodeInTree(nodes: TreeNode[], nodeId: string, updates: Partial<TreeNode>): TreeNode[] {
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

export function buildTreeFromFlat(nodes: TreeNode[]): TreeNode[] {
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

export function findNodeInTree(nodes: TreeNode[], nodeId: string): TreeNode | null {
    for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
            const found = findNodeInTree(node.children, nodeId);
            if (found) return found;
        }
    }
    return null;
}

export function collectTreeIds(nodes: TreeNode[]): Set<string> {
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

export function getAllDescendantIds(node: TreeNode): string[] {
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

export function filterTreeBySearch(nodes: TreeNode[], term: string): TreeNode[] {
    const nt = normalizeFa(term);
    if (!nt) return nodes;

    const filter = (node: TreeNode): TreeNode | null => {
        const selfMatch =
            normalizeFa(node.title).includes(nt) ||
            (node.path ? normalizeFa(node.path).includes(nt) : false);
        const filteredChildren = (node.children || [])
            .map(filter)
            .filter((n): n is TreeNode => n !== null);

        if (selfMatch) return { ...node };
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

export function buildChildrenMap(allCategories: any[]): Map<string, any[]> {
    const map = new Map<string, any[]>();
    for (const c of allCategories) {
        const key = c.parentId || '__root__';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(c);
    }
    return map;
}

export function buildScopeTreeFromIds(
    ids: Set<string>,
    currentScopeTree: TreeNode[],
    allCategories: any[],
): TreeNode[] {
    if (!allCategories || allCategories.length === 0) return currentScopeTree;

    const catMap = new Map(allCategories.map((c: any) => [c.id, c]));
    const childrenMap = buildChildrenMap(allCategories);

    const idSet = new Set(ids);

    for (const id of Array.from(idSet)) {
        let pid = catMap.get(id)?.parentId;
        while (pid && !idSet.has(pid)) {
            idSet.add(pid);
            pid = catMap.get(pid)?.parentId;
        }
    }

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

    const isRefFolder = (id: string) => (childrenMap.get(id)?.length ?? 0) > 0;
    const cleanup = (list: TreeNode[]): TreeNode[] =>
        list
            .map(n => ({ ...n, children: n.children ? cleanup(n.children) : [] }))
            .filter(n => (n.children?.length ?? 0) > 0 || !isRefFolder(n.id));

    return cleanup(tree);
}

export function buildCheckStates(roots: TreeNode[], checkedIds: Set<string>): Map<string, CheckState> {
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