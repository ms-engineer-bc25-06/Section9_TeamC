// API関連定数
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    HEALTH: '/health',
    AUTH: {
      LOGIN: '/api/auth/login',
      PROFILE: '/api/auth/profile',
      TEST: '/api/auth/test',
    },
    CHILDREN: {
      BASE: '/api/children',
      DETAIL: (id: string) => `/api/children/${id}`,
    },
    VOICE: {
      TRANSCRIBE: '/api/voice/transcribe',
      TRANSCRIPT: (id: string) => `/api/voice/transcript/${id}`,
      HISTORY: (childId: string) => `/api/voice/history/${childId}`,
      CHALLENGE: (id: string) => `/api/voice/challenge/${id}`,
    },
    FEEDBACK: {
      GENERATE: (transcriptId: string) => `/api/voice/transcript/${transcriptId}`,
      DELETE: (challengeId: string) => `/api/ai-feedback/${challengeId}`,
    },
  },
  TIMEOUTS: {
    DEFAULT: 10000,
    UPLOAD: 30000,
  },
} as const;