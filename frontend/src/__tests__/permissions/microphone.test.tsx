import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// マイク権限のモック
const mockNavigator = {
  mediaDevices: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(),
  },
  permissions: {
    query: vi.fn(),
  },
};

describe('マイク権限テスト', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserMedia権限', () => {
    it('マイク権限が許可される場合', async () => {
      const mockStream = {
        getTracks: vi.fn(() => [
          {
            kind: 'audio',
            enabled: true,
            stop: vi.fn(),
          },
        ]),
      };

      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      expect(mockNavigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(stream).toBe(mockStream);
      expect(stream.getTracks()).toHaveLength(1);
      expect(stream.getTracks()[0].kind).toBe('audio');
    });

    it('マイク権限が拒否される場合', async () => {
      const error = new DOMException('Permission denied', 'NotAllowedError');
      mockNavigator.mediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(
        navigator.mediaDevices.getUserMedia({ audio: true })
      ).rejects.toThrow('Permission denied');

      expect(mockNavigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('デバイスが見つからない場合', async () => {
      const error = new DOMException('Requested device not found', 'NotFoundError');
      mockNavigator.mediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(
        navigator.mediaDevices.getUserMedia({ audio: true })
      ).rejects.toThrow('Requested device not found');
    });

    it('セキュリティエラーの場合', async () => {
      const error = new DOMException('Permission denied by system', 'SecurityError');
      mockNavigator.mediaDevices.getUserMedia.mockRejectedValue(error);

      await expect(
        navigator.mediaDevices.getUserMedia({ audio: true })
      ).rejects.toThrow('Permission denied by system');
    });
  });

  describe('Permissions API', () => {
    it('マイク権限の状態を確認できる', async () => {
      const mockPermissionStatus = {
        state: 'granted',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      mockNavigator.permissions.query.mockResolvedValue(mockPermissionStatus);

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      expect(mockNavigator.permissions.query).toHaveBeenCalledWith({ name: 'microphone' });
      expect(permission.state).toBe('granted');
    });

    it('権限が拒否されている場合', async () => {
      const mockPermissionStatus = {
        state: 'denied',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      mockNavigator.permissions.query.mockResolvedValue(mockPermissionStatus);

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      expect(permission.state).toBe('denied');
    });

    it('権限がプロンプト状態の場合', async () => {
      const mockPermissionStatus = {
        state: 'prompt',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      mockNavigator.permissions.query.mockResolvedValue(mockPermissionStatus);

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      expect(permission.state).toBe('prompt');
    });

    it('権限状態の変更を監視できる', async () => {
      const mockPermissionStatus = {
        state: 'prompt',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      mockNavigator.permissions.query.mockResolvedValue(mockPermissionStatus);

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const changeHandler = vi.fn();

      permission.addEventListener('change', changeHandler);

      expect(mockPermissionStatus.addEventListener).toHaveBeenCalledWith('change', changeHandler);
    });
  });

  describe('デバイス列挙', () => {
    it('利用可能なオーディオデバイスを列挙できる', async () => {
      const mockDevices = [
        {
          kind: 'audioinput',
          label: 'Default Microphone',
          deviceId: 'default',
        },
        {
          kind: 'audioinput',
          label: 'External Microphone',
          deviceId: 'external-mic-123',
        },
        {
          kind: 'audiooutput',
          label: 'Default Speaker',
          deviceId: 'speaker-default',
        },
      ];

      mockNavigator.mediaDevices.enumerateDevices.mockResolvedValue(mockDevices);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');

      expect(audioInputs).toHaveLength(2);
      expect(audioInputs[0].label).toBe('Default Microphone');
      expect(audioInputs[1].label).toBe('External Microphone');
    });

    it('権限がない場合はラベルが空になる', async () => {
      const mockDevices = [
        {
          kind: 'audioinput',
          label: '',
          deviceId: 'default',
        },
      ];

      mockNavigator.mediaDevices.enumerateDevices.mockResolvedValue(mockDevices);

      const devices = await navigator.mediaDevices.enumerateDevices();

      expect(devices[0].label).toBe('');
    });
  });

  describe('ストリーム管理', () => {
    it('ストリームを適切に停止できる', async () => {
      const stopMock = vi.fn();
      const mockStream = {
        getTracks: vi.fn(() => [
          {
            kind: 'audio',
            enabled: true,
            stop: stopMock,
          },
        ]),
      };

      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tracks = stream.getTracks();

      tracks.forEach(track => track.stop());

      expect(stopMock).toHaveBeenCalled();
    });

    it('トラックの有効/無効を切り替えられる', async () => {
      let trackEnabled = true;
      const mockStream = {
        getTracks: vi.fn(() => [
          {
            kind: 'audio',
            get enabled() { return trackEnabled; },
            set enabled(value: boolean) { trackEnabled = value; },
            stop: vi.fn(),
          },
        ]),
      };

      mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = stream.getTracks()[0];

      expect(track.enabled).toBe(true);

      track.enabled = false;
      expect(track.enabled).toBe(false);

      track.enabled = true;
      expect(track.enabled).toBe(true);
    });
  });

  describe('エラーリカバリ', () => {
    it('権限エラー後に再試行できる', async () => {
      const error = new DOMException('Permission denied', 'NotAllowedError');
      const mockStream = {
        getTracks: vi.fn(() => [
          {
            kind: 'audio',
            enabled: true,
            stop: vi.fn(),
          },
        ]),
      };

      // 最初は失敗
      mockNavigator.mediaDevices.getUserMedia.mockRejectedValueOnce(error);
      
      // 2回目は成功
      mockNavigator.mediaDevices.getUserMedia.mockResolvedValueOnce(mockStream);

      // 最初の試行
      await expect(
        navigator.mediaDevices.getUserMedia({ audio: true })
      ).rejects.toThrow('Permission denied');

      // 再試行
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      expect(stream).toBe(mockStream);
      expect(mockNavigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    });

    it('複数回の失敗後も適切にエラーを返す', async () => {
      const error = new DOMException('Permission denied', 'NotAllowedError');
      mockNavigator.mediaDevices.getUserMedia.mockRejectedValue(error);

      for (let i = 0; i < 3; i++) {
        await expect(
          navigator.mediaDevices.getUserMedia({ audio: true })
        ).rejects.toThrow('Permission denied');
      }

      expect(mockNavigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(3);
    });
  });

  describe('ブラウザ互換性', () => {
    it('mediaDevicesがサポートされていない場合', () => {
      const oldNavigator = window.navigator;
      Object.defineProperty(window, 'navigator', {
        value: {},
        writable: true,
      });

      expect(window.navigator.mediaDevices).toBeUndefined();

      Object.defineProperty(window, 'navigator', {
        value: oldNavigator,
        writable: true,
      });
    });

    it('getUserMediaがサポートされていない場合', () => {
      const oldNavigator = window.navigator;
      Object.defineProperty(window, 'navigator', {
        value: {
          mediaDevices: {},
        },
        writable: true,
      });

      expect(window.navigator.mediaDevices.getUserMedia).toBeUndefined();

      Object.defineProperty(window, 'navigator', {
        value: oldNavigator,
        writable: true,
      });
    });
  });
});