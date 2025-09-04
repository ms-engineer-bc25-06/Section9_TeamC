'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Child {
  id: string;
  nickname?: string;
  name: string;
}

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string;
  onChildSelect: (childId: string) => void;
}

export function ChildSelector({ children, selectedChildId, onChildSelect }: ChildSelectorProps) {
  return (
    <div className="mb-8 w-full max-w-xs">
      <Select onValueChange={onChildSelect} value={selectedChildId}>
        <SelectTrigger className="w-full rounded-full bg-white/80 shadow-md text-lg font-semibold text-gray-700">
          <SelectValue placeholder="お子さまを選択" />
        </SelectTrigger>
        <SelectContent className="rounded-xl bg-white/90 shadow-lg">
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id} className="text-lg">
              {child.nickname || child.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
