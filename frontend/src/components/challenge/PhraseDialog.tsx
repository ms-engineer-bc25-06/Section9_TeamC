// フレーズダイアログコンポーネント - 分離とテスト可能化

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

interface PhraseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  phrases: string[];
  onPhraseSelect?: (phrase: string) => void;
}

export const PhraseDialog: React.FC<PhraseDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  phrases,
  onPhraseSelect,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {title}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {phrases.map((phrase, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{phrase}</p>
              {onPhraseSelect && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    onPhraseSelect(phrase);
                    onClose();
                  }}
                >
                  この表現を使用
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};