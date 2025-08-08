// ダミーデータ（メモリ上に保存）
let mockChildren = [
  { id: 1, name: "ひなた", birthdate: "2018-04-15" },
  { id: 2, name: "さくら", birthdate: "2017-08-20" },
];
let nextId = 3;

export const mockApi = {
  // ヘルスチェック
  health: async () => {
    // 少し遅延させて本物っぽく
    await new Promise(resolve => setTimeout(resolve, 100));
    return { status: 'healthy (mock)' };
  },
  
  // 子ども管理
  children: {
    // 一覧取得
    list: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('📋 モックAPI: 子ども一覧を返します');
      return mockChildren;
    },
    
    // 新規登録
    create: async (data: { name: string; birthdate: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newChild = {
        id: nextId++,
        name: data.name,
        birthdate: data.birthdate,
      };
      
      mockChildren.push(newChild);
      console.log('✅ モックAPI: 子どもを登録しました', newChild);
      
      return newChild;
    },
  },
};
