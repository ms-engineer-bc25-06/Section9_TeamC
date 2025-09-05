'use client';

import { useEffect, useRef, useState } from 'react';

// Web Speech APIの型定義
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

export function useVoiceRecording() {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [shouldKeepListening, setShouldKeepListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const lastSpeechTimeRef = useRef<number>(Date.now());

  const isSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  useEffect(() => {
    const cleanup = () => {
      setShouldKeepListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };

    const handleBeforeUnload = () => {
      cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, []);

  const startRecognition = () => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'ja-JP';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        const currentTime = Date.now();
        const timeSinceLastSpeech = currentTime - lastSpeechTimeRef.current;

        const separator =
          timeSinceLastSpeech > 3000 && accumulatedTranscriptRef.current.length > 0 ? '\n\n' : '';

        accumulatedTranscriptRef.current += separator + finalTranscript;
        lastSpeechTimeRef.current = currentTime;
      }

      const displayText =
        accumulatedTranscriptRef.current + (interimTranscript ? ' ' + interimTranscript : '');

      setTranscription(displayText);
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('音声認識エラー:', event.error);

      if (shouldKeepListening) {
        setTimeout(() => {
          if (shouldKeepListening) {
            startRecognition();
          }
        }, 500);
      }
    };

    recognitionRef.current.onend = () => {
      if (shouldKeepListening) {
        setTimeout(() => {
          if (shouldKeepListening) {
            startRecognition();
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current.start();
  };

  const startListening = () => {
    setShouldKeepListening(true);
    accumulatedTranscriptRef.current = '';
    lastSpeechTimeRef.current = Date.now();
    setTranscription('');
    startRecognition();
  };

  const stopListening = () => {
    setShouldKeepListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const resetTranscription = () => {
    setTranscription('');
    accumulatedTranscriptRef.current = '';
  };

  return {
    isListening,
    transcription,
    isSupported,
    startListening,
    stopListening,
    resetTranscription,
  };
}
