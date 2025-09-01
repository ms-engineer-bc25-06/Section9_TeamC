// バリデーション関数
import { UI_CONFIG } from '@/constants/ui';

export const validateNickname = (value: string): string | null => {
  if (!value || !value.trim()) {
    return 'ニックネームは必須です';
  }
  if (value.trim().length > UI_CONFIG.MAX_NICKNAME_LENGTH) {
    return `ニックネームは${UI_CONFIG.MAX_NICKNAME_LENGTH}文字以内で入力してください`;
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
  minDate.setFullYear(today.getFullYear() - UI_CONFIG.MAX_AGE_YEARS);
  if (date < minDate) {
    return `${UI_CONFIG.MAX_AGE_YEARS}歳以下の子どもを登録してください`;
  }
  
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || !value.trim()) {
    return `${fieldName}は必須です`;
  }
  return null;
};