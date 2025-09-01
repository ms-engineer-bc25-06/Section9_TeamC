// 音声認識関連定数 - マジックナンバー排除

export const SPEECH_CONFIG = {
  // 音声認識設定
  LANGUAGE: 'ja-JP',
  CONTINUOUS: true,
  INTERIM_RESULTS: true,
  
  // タイミング設定
  SILENCE_THRESHOLD_MS: 3000,  // 無音判定の閾値（3秒）
  RETRY_DELAY_MS: 500,         // 再試行間隔
  AUTO_RESTART_DELAY_MS: 100,  // 自動再開遅延
  
  // UI関連
  RECORDING_INDICATOR_PULSE_MS: 1000, // 録音インジケーターの点滅間隔
} as const;