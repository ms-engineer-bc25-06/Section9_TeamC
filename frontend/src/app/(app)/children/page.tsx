'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { api } from '@/lib/api';
import { BookOpen, Calendar, Edit3, Plus, Rocket, Star, Trash2 } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Child {
  id: number;
  name: string;
  age: number;
}

export default function ChildrenPage() {
  const { user, logout, loading } = useAuth();
  const {
    children: apiChildren,
    isLoading: childrenLoading,
    error,
    getDisplayName,
  } = useChildren();
  const router = useRouter();
  const [backendUserName, setBackendUserName] = useState<string>('');

  // ローカル状態（編集・追加用）
  const [children, setChildren] = useState<Child[]>([]);
  const [newChild, setNewChild] = useState({ name: '', age: '' });
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // バックエンドから正式な名前を取得
  useEffect(() => {
    const fetchUserName = async () => {
      if (user && !backendUserName) {
        try {
          console.log('🔍 バックエンドから名前を取得中...');
          const authTest = await api.auth.test();
          console.log('✅ バックエンドレスポンス:', authTest);

          if (authTest.name) {
            setBackendUserName(authTest.name);
            console.log('💾 名前を設定:', authTest.name);
          }
        } catch (error) {
          console.error('❌ 名前取得エラー:', error);
          // エラーの場合はFirebaseの情報にフォールバック
          console.log('🔄 Firebaseの情報にフォールバック');
        }
      }
    };

    fetchUserName();
  }, [user, backendUserName]);

  // API子どもデータを変換
  useEffect(() => {
    if (apiChildren) {
      const transformedChildren = apiChildren.map((child) => ({
        id: child.id,
        name: child.nickname || child.name,
        age: child.birth_date
          ? new Date().getFullYear() - new Date(child.birth_date).getFullYear()
          : 0,
      }));
      setChildren(transformedChildren);
    }
  }, [apiChildren]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) router.push('/');
  };

  // 表示名を決定する関数
  const getDisplayUserName = () => {
    if (backendUserName) {
      return backendUserName;
    }
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'ユーザー';
  };

  const addChild = () => {
    if (newChild.name && newChild.age) {
      const child: Child = {
        id: Date.now(),
        name: newChild.name,
        age: parseInt(newChild.age),
      };
      setChildren([...children, child]);
      setNewChild({ name: '', age: '' });
      setIsAddDialogOpen(false);
    }
  };

  const editChild = (child: Child) => {
    setEditingChild(child);
    setIsEditDialogOpen(true);
  };

  const saveEdit = () => {
    if (editingChild) {
      setChildren(children.map((child) => (child.id === editingChild.id ? editingChild : child)));
      setEditingChild(null);
      setIsEditDialogOpen(false);
    }
  };

  const deleteChild = (id: number) => {
    setChildren(children.filter((child) => child.id !== id));
  };

  if (loading || childrenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>🔄 読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* ヘッダー */}
        <header className="w-full max-w-4xl flex justify-between items-center mb-4 px-2 sm:px-0">
          <div>
            <p className="text-gray-600 text-sm sm:text-lg">Hello, {getDisplayUserName()}! 👋</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white text-sm sm:text-base rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </header>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            エラー: {error}
          </div>
        )}

        {/* メインコンテンツ */}
        <main className="flex w-full max-w-xl flex-1 flex-col items-center justify-center py-4 sm:py-8 px-2 sm:px-0">
          <h2 className="mb-6 sm:mb-8 text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">
            Who's Ready for Today? 🚀
          </h2>

          {/* 子ども一覧 */}
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <div key={child.id} className="relative">
                <Card className="flex h-full cursor-pointer flex-col justify-center rounded-xl bg-white/70 backdrop-blur-md p-4 sm:p-6 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-white/50">
                  <CardContent className="flex flex-col p-0 space-y-4">
                    {/* 子ども情報表示 */}
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-bold text-gray-700">{child.name}</p>
                      <div className="flex items-center justify-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-black font-medium">{child.age}歳</span>
                      </div>
                    </div>

                    {/* チャレンジボタン */}
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg py-3"
                      onClick={() => {
                        // チャレンジ画面への遷移処理
                        console.log(`${child.name} がチャレンジ開始！`);
                      }}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      I'm Ready! ⭐
                    </Button>

                    {/* 編集・削除ボタン */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editChild(child)}
                        className="flex-1"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteChild(child.id)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </main>

        {/* フッターボタン群 */}
        <footer className="sticky bottom-0 z-10 mt-4 sm:mt-8 w-full max-w-4xl rounded-t-xl bg-white/90 p-2 sm:p-4 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:justify-around sm:gap-2">
            {/* 新しいチャレンジャー追加 */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 text-sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Challenger! 🎉
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-center">
                    Add New Challenger! 🎉
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      お名前
                    </Label>
                    <Input
                      id="name"
                      value={newChild.name}
                      onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                      placeholder="例：太郎"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age" className="text-sm font-medium">
                      年齢
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      value={newChild.age}
                      onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
                      placeholder="例：7"
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={addChild} className="w-full mt-6 h-11">
                    追加する
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* 学習進捗 */}
            <Button
              variant="outline"
              className="w-full bg-white border-2 border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold py-2 text-sm"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              My Progress 📈
            </Button>

            {/* アドバンスラーニング */}
            <Button
              variant="outline"
              className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 text-amber-700 font-semibold py-2 text-sm"
            >
              <Rocket className="h-4 w-4 mr-1 text-amber-500" />
              Advanced Learning 🚀
            </Button>
          </div>
        </footer>

        {/* 編集ダイアログ */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Edit Challenger Info
              </DialogTitle>
            </DialogHeader>
            {editingChild && (
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium">
                    お名前
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingChild.name}
                    onChange={(e) => setEditingChild({ ...editingChild, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-age" className="text-sm font-medium">
                    年齢
                  </Label>
                  <Input
                    id="edit-age"
                    type="number"
                    value={editingChild.age.toString()}
                    onChange={(e) =>
                      setEditingChild({ ...editingChild, age: parseInt(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
                <Button onClick={saveEdit} className="w-full mt-6 h-11">
                  変更を保存
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
