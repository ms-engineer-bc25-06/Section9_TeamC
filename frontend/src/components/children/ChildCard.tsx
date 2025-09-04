'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Calendar, Edit3, Star, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Child {
  id: string;
  name: string;
  age: number;
}

interface ChildCardProps {
  child: Child;
}

export function ChildCard({ child }: ChildCardProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(`${child.name}を削除しますか？`)) {
      try {
        await api.children.delete(child.id);
        window.location.reload();
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      }
    }
  };

  return (
    <div className="relative">
      <Card className="flex h-full cursor-pointer flex-col justify-center rounded-xl bg-white/70 backdrop-blur-md p-4 sm:p-6 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-white/50">
        <CardContent className="flex flex-col p-0 space-y-4">
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold text-gray-700">{child.name}</p>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-black font-medium">{child.age}歳</span>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg py-3"
            onClick={() => router.push(`/children/confirm?childId=${child.id}`)}
          >
            <Star className="w-4 h-4 mr-2" />
            スタート
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/children/edit/${child.id}`)}
              className="flex-1"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="flex-1">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
