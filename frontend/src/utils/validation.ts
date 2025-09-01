// バリデーション関数
export const validateNickname = (value: string): string | null => {
  if (!value || !value.trim()) {
    return 'ニックネームは必須です';
  }
  if (value.trim().length > 50) {
    return 'ニックネームは50文字以内で入力してください';
  }
  return null;
};

export const validateBirthdate = (value: string): string | null => {
  if (!value) return null; // 任意項目
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return '正しい日付を入力してください';
  }
  
  const today = new Date();
  if (date > today) {
    return '未来の日付は入力できません';
  }
  
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 15);
  if (date < minDate) {
    return '15歳以下の子どもを登録してください';
  }
  
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || !value.trim()) {
    return `${fieldName}は必須です`;
  }
  return null;
};