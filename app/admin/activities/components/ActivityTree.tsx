// app/admin/activities/components/ActivityTree.tsx
'use client';
import React from 'react';
import { ActivityNode as ActivityNodeType } from '../page';
import { ActivityNodeComponent } from './ActivityNode';

interface Props {
    nodes: ActivityNodeType[];
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onEdit: (a: ActivityNodeType) => void;
    onDelete: (a: ActivityNodeType) => void;
    onAddChild: (p: ActivityNodeType) => void;
}

export function ActivityTree({ nodes, expandedIds, onToggle, onEdit, onDelete, onAddChild }: Props) {
    return (
        <div className="divide-y divide-outline-variant/20">
            {nodes.map(node => (
                <ActivityNodeComponent key={node.id} node={node} expandedIds={expandedIds}
                                       onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
            ))}
        </div>
    );
}