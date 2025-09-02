// ログユーティリティ - 環境別ログレベル制御

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

class Logger {
  private currentLevel: LogLevel;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2, 
    error: 3,
    none: 4,
  };

  constructor() {
    this.currentLevel = (process.env.NODE_ENV === 'production') 
      ? 'error' 
      : (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.currentLevel];
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`ℹ️ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(`✅ ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
export const devLog = (message: string, ...args: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, ...args);
  }
};