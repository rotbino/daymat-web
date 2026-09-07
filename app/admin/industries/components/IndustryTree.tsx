// app/admin/industries/components/IndustryTree.tsx
'use client';

import React from 'react';
import { IndustryNode as IndustryNodeType } from '../page';
import { IndustryNodeComponent } from './IndustryNode';

interface IndustryTreeProps {
    nodes: IndustryNodeType[];
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onEdit: (ind: IndustryNodeType) => void;
    onDelete: (ind: IndustryNodeType) => void;
    onAddChild: (parent: IndustryNodeType) => void;
}

export function IndustryTree({ nodes, expandedIds, onToggle, onEdit, onDelete, onAddChild }: IndustryTreeProps) {
    return (
        <div className="divide-y divide-outline-variant/20">
            {nodes.map(node => (
                <IndustryNodeComponent
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