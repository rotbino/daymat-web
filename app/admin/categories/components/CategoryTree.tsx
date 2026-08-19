// app/admin/categories/components/CategoryTree.tsx
'use client';

import React from 'react';
import { CategoryNode as CategoryNodeType } from '../page';
import { CategoryNodeComponent } from './CategoryNode';

interface CategoryTreeProps {
    nodes: CategoryNodeType[];
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onEdit: (cat: CategoryNodeType) => void;
    onDelete: (cat: CategoryNodeType) => void;
    onAddChild: (parent: CategoryNodeType) => void;
}

export function CategoryTree({ nodes, expandedIds, onToggle, onEdit, onDelete, onAddChild }: CategoryTreeProps) {
    return (
        <div className="divide-y divide-outline-variant/20">
            {nodes.map(node => (
                <CategoryNodeComponent
                    key={node.id}
                    node={node}
                    expandedIds={expandedIds}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddChild={onAddChild}
                />
            ))}
        </div>
    );
}