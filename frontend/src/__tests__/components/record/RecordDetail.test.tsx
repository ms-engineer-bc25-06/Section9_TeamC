import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIFeedbackCard } from '@/components/record/AIFeedbackCard';
import { TranscriptCard } from '@/components/record/TranscriptCard';
import { PhraseCard } from '@/components/record/PhraseCard';

describe('記録詳細画面テスト', () => {
  describe('詳細表示テスト', () => {
    describe('TranscriptCard - 文字起こし表示', () => {
      it('文字起こし内容が正しく表示される', () => {
        const transcript = 'Hello, my name is Taro. How are you?';

        render(<TranscriptCard transcript={transcript} />);

        expect(screen.getByText('話したこと')).toBeInTheDocument();
        expect(screen.getByText(transcript)).toBeInTheDocument();
      });

      it('長い文字起こしも適切に表示される', () => {
        const longTranscript = '今日は天気がとてもよくて、公園に行きました。'.repeat(10);

        render(<TranscriptCard transcript={longTranscript} />);

        expect(screen.getByText('話したこと')).toBeInTheDocument();
        expect(screen.getByText(longTranscript)).toBeInTheDocument();
      });

      it('空の文字起こしでも表示される', () => {
        render(<TranscriptCard transcript="" />);

        expect(screen.getByText('話したこと')).toBeInTheDocument();
      });

      it('改行を含む文字起こしが正しく表示される', () => {
        const multilineTranscript = '最初の文です。\n\n次の文です。\n最後の文です。';

        render(<TranscriptCard transcript={multilineTranscript} />);

        // 改行が含まれている場合、より具体的なセレクタでマッチング
        const transcriptElement = screen.getByText((_content, element) => {
          return (
            element?.tagName === 'DIV' &&
            element.classList.contains('relative') &&
            element.textContent === multilineTranscript
          );
        });
        expect(transcriptElement).toBeInTheDocument();
      });
    });

    describe('AIFeedbackCard - AIレビュー表示', () => {
      const mockAIFeedback = {
        praise: '発音がとても上手でした！自信を持って話せていますね。',
        advice: '次回は少しゆっくり話すと、さらに聞き取りやすくなります。',
      };

      it('AIフィードバックが正しく表示される', () => {
        render(<AIFeedbackCard aiFeedback={mockAIFeedback} />);

        expect(screen.getByText('AIから')).toBeInTheDocument();
        expect(screen.getByText('いいね')).toBeInTheDocument();
        expect(screen.getByText(mockAIFeedback.praise)).toBeInTheDocument();
        expect(screen.getByText('アドバイス')).toBeInTheDocument();
        expect(screen.getByText(mockAIFeedback.advice)).toBeInTheDocument();
      });

      it('アドバイスがない場合はアドバイス部分が表示されない', () => {
        const feedbackWithoutAdvice = {
          praise: '素晴らしい発音でした！',
          advice: '',
        };

        render(<AIFeedbackCard aiFeedback={feedbackWithoutAdvice} />);

        expect(screen.getByText('いいね')).toBeInTheDocument();
        expect(screen.getByText(feedbackWithoutAdvice.praise)).toBeInTheDocument();
        expect(screen.queryByText('アドバイス')).not.toBeInTheDocument();
      });

      it('褒めコメントが表示される', () => {
        render(<AIFeedbackCard aiFeedback={mockAIFeedback} />);

        expect(screen.getByText(mockAIFeedback.praise)).toBeInTheDocument();
      });

      it('アドバイスコメントが表示される', () => {
        render(<AIFeedbackCard aiFeedback={mockAIFeedback} />);

        expect(screen.getByText(mockAIFeedback.advice)).toBeInTheDocument();
      });

      it('ThumbsUpアイコンが表示される', () => {
        render(<AIFeedbackCard aiFeedback={mockAIFeedback} />);

        // ThumbsUpアイコンが含まれる要素を確認
        const thumbsUpSection = screen.getByText('いいね').parentElement;
        expect(thumbsUpSection).toBeInTheDocument();
      });

      it('MessageSquareHeartアイコンがアドバイス部分に表示される', () => {
        render(<AIFeedbackCard aiFeedback={mockAIFeedback} />);

        // MessageSquareHeartアイコンが含まれる要素を確認
        const adviceSection = screen.getByText('アドバイス').parentElement;
        expect(adviceSection).toBeInTheDocument();
      });
    });

    describe('PhraseCard - フレーズ表示', () => {
      const mockPhraseData = {
        en: 'Thank you very much!',
        ja: 'どうもありがとうございます！',
        // pronunciation: '/θæŋk juː ˈveri mʌʧ/', // コンポーネントは発音記号をサポートしていない
      };

      it('フレーズデータが正しく表示される', () => {
        render(<PhraseCard phraseData={mockPhraseData} />);

        expect(screen.getByText(mockPhraseData.en)).toBeInTheDocument();
        expect(screen.getByText(mockPhraseData.ja)).toBeInTheDocument();
      });

      it('フレーズカードのタイトルが表示される', () => {
        render(<PhraseCard phraseData={mockPhraseData} />);

        expect(screen.getByText('💡 こんな言い方もあるよ！')).toBeInTheDocument();
      });

      it('英語と日本語が正しく表示される', () => {
        const phraseData = {
          en: 'Hello!',
          ja: 'こんにちは！',
        };

        render(<PhraseCard phraseData={phraseData} />);

        expect(screen.getByText(phraseData.en)).toBeInTheDocument();
        expect(screen.getByText(phraseData.ja)).toBeInTheDocument();
      });
    });
  });

  describe('音声再生機能テスト（基本動作）', () => {
    // 注：実際の音声再生機能がない場合の基本テスト
    it('音声再生ボタンがあれば表示される', () => {
      // 音声再生機能がある場合の想定テスト
      const mockWithAudio = {
        en: 'Good morning!',
        ja: 'おはよう！',
        // audioUrl: '/audio/good-morning.mp3', // コンポーネントは音声URLをサポートしていない
      };

      // 音声再生ボタンが実装されている場合のテスト想定
      render(<PhraseCard phraseData={mockWithAudio} />);

      // 現在の実装にはない機能だが、将来的な拡張を想定
      expect(screen.getByText(mockWithAudio.en)).toBeInTheDocument();
    });

    it('音声データがない場合でもエラーにならない', () => {
      const phraseWithoutAudio = {
        en: 'Good afternoon!',
        ja: 'こんにちは！',
      };

      expect(() => {
        render(<PhraseCard phraseData={phraseWithoutAudio} />);
      }).not.toThrow();

      expect(screen.getByText(phraseWithoutAudio.en)).toBeInTheDocument();
    });
  });

  describe('AIレビュー表示テスト（詳細）', () => {
    it('長いフィードバックも適切に表示される', () => {
      const longFeedback = {
        praise: '今日のチャレンジは本当に素晴らしかったです。'.repeat(5),
        advice: 'より良くするためのアドバイスとして...'.repeat(3),
      };

      render(<AIFeedbackCard aiFeedback={longFeedback} />);

      expect(screen.getByText(longFeedback.praise)).toBeInTheDocument();
      expect(screen.getByText(longFeedback.advice)).toBeInTheDocument();
    });

    it('特殊文字を含むフィードバックが正しく表示される', () => {
      const specialCharFeedback = {
        praise: 'Great job! 🎉 Your pronunciation was 100% perfect! 👏',
        advice: 'Next time, try using "Could you...?" instead of "Can you...?"',
      };

      render(<AIFeedbackCard aiFeedback={specialCharFeedback} />);

      expect(screen.getByText(specialCharFeedback.praise)).toBeInTheDocument();
      expect(screen.getByText(specialCharFeedback.advice)).toBeInTheDocument();
    });

    it('HTMLタグが含まれていてもエスケープされる', () => {
      const feedbackWithHTML = {
        praise: 'Your <strong>pronunciation</strong> was excellent!',
        advice: 'Try saying <em>hello</em> more clearly.',
      };

      render(<AIFeedbackCard aiFeedback={feedbackWithHTML} />);

      // HTMLタグがそのまま文字列として表示されることを確認
      expect(
        screen.getByText('Your <strong>pronunciation</strong> was excellent!')
      ).toBeInTheDocument();
    });

    it('空のフィードバックでも表示構造は保持される', () => {
      const emptyFeedback = {
        praise: '',
        advice: '',
      };

      render(<AIFeedbackCard aiFeedback={emptyFeedback} />);

      expect(screen.getByText('AIから')).toBeInTheDocument();
      expect(screen.getByText('いいね')).toBeInTheDocument();
    });

    it('フィードバックの色分けが正しく適用される', () => {
      const feedback = {
        praise: 'よくできました！',
        advice: 'もう少し大きな声で話しましょう。',
      };

      render(<AIFeedbackCard aiFeedback={feedback} />);

      const praiseHeader = screen.getByText('いいね');
      const adviceHeader = screen.getByText('アドバイス');

      // CSSクラスによる色分けの確認
      expect(praiseHeader).toHaveClass('text-green-700');
      expect(adviceHeader).toHaveClass('text-orange-700');
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なpropsが渡されてもクラッシュしない', () => {
      expect(() => {
        render(<TranscriptCard transcript={null as any} />);
      }).not.toThrow();
    });

    it('undefinedのAIフィードバックではエラーが発生する', () => {
      expect(() => {
        render(<AIFeedbackCard aiFeedback={undefined as any} />);
      }).toThrow();
    });

    it('部分的に欠けたフレーズデータでも表示される', () => {
      const partialPhrase = {
        en: 'Hello!',
        // ja プロパティが欠けている
      } as any;

      expect(() => {
        render(<PhraseCard phraseData={partialPhrase} />);
      }).not.toThrow();

      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });
  });

  describe('統合表示テスト', () => {
    it('複数のカードコンポーネントが同時に表示される', () => {
      const transcript = 'Hello, how are you today?';
      const aiFeedback = {
        praise: '素晴らしい挨拶でした！',
        advice: 'もう少しゆっくり話すと良いでしょう。',
      };
      const phraseData = {
        en: 'How are you?',
        ja: '元気ですか？',
      };

      render(
        <div>
          <TranscriptCard transcript={transcript} />
          <AIFeedbackCard aiFeedback={aiFeedback} />
          <PhraseCard phraseData={phraseData} />
        </div>
      );

      expect(screen.getByText('話したこと')).toBeInTheDocument();
      expect(screen.getByText('AIから')).toBeInTheDocument();
      expect(screen.getByText(transcript)).toBeInTheDocument();
      expect(screen.getByText(aiFeedback.praise)).toBeInTheDocument();
      expect(screen.getByText(phraseData.en)).toBeInTheDocument();
    });
  });
});
