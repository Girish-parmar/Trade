import { renderHook, act, waitFor } from '@testing-library/react';
import useAuthStore from '../../../../frontend/src/stores/authStore';
import apiClient from '../../../../frontend/src/lib/api';

jest.mock('../../../../frontend/src/lib/api');

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, isLoading: false, error: null });
  });

  describe('checkAuth', () => {
    it('should set user when auth check succeeds', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      
      apiClient.get.mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should clear user when auth check fails', async () => {
      apiClient.get.mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('login', () => {
    it('should set user on successful login', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };
      
      apiClient.post.mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuthStore());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult.success).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failed login', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { detail: 'Invalid credentials' } },
      });

      const { result } = renderHook(() => useAuthStore());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Invalid credentials');
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should set user on successful registration', async () => {
      const mockUser = {
        id: '123',
        email: 'new@example.com',
        name: 'New User',
      };
      
      apiClient.post.mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuthStore());

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register('new@example.com', 'password123', 'New User');
      });

      expect(registerResult.success).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle duplicate email error', async () => {
      apiClient.post.mockRejectedValue({
        response: { data: { detail: 'Email already registered' } },
      });

      const { result } = renderHook(() => useAuthStore());

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register('existing@example.com', 'password123', 'User');
      });

      expect(registerResult.success).toBe(false);
      expect(result.current.error).toBe('Email already registered');
    });
  });

  describe('logout', () => {
    it('should clear user on successful logout', async () => {
      apiClient.post.mockResolvedValue({});

      const { result } = renderHook(() => useAuthStore());
      
      // Set initial user
      act(() => {
        useAuthStore.setState({ user: { id: '123', email: 'test@example.com' } });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        useAuthStore.setState({ error: 'Some error' });
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});