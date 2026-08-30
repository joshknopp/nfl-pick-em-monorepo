import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import * as admin from 'firebase-admin';

const mockAuth = {
  verifyIdToken: jest.fn(),
};

const mockDocRef = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockFirestore = {
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue(mockDocRef),
  }),
};

jest.mock('firebase-admin', () => ({
  apps: [{ name: 'test-app' }],
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn(),
  },
  auth: () => mockAuth,
  firestore: () => mockFirestore,
}));

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AuthGuard();
  });

  const createMockContext = (authHeader?: string) => {
    const request: any = {
      headers: authHeader ? { authorization: authHeader } : {},
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    return { context, request };
  };

  it('should throw UnauthorizedException if no Authorization header', async () => {
    const { context } = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    const { context } = createMockContext('Bearer invalid-token');
    mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('should set isActive=true if user document does not exist', async () => {
    const { context, request } = createMockContext('Bearer valid-token');
    mockAuth.verifyIdToken.mockResolvedValue({ uid: 'user123', email: 'user@example.com' });
    mockDocRef.get.mockResolvedValue({ exists: false, data: () => null });
    mockDocRef.set.mockResolvedValue(undefined);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ id: 'user123', uid: 'user123', email: 'user@example.com' });
    expect(mockFirestore.collection).toHaveBeenCalledWith('users');
    expect(mockFirestore.collection('users').doc).toHaveBeenCalledWith('user123');
    expect(mockDocRef.set).toHaveBeenCalledWith({ isActive: true }, { merge: true });
  });

  it('should set isActive=true if user document exists with isActive=false', async () => {
    const { context } = createMockContext('Bearer valid-token');
    mockAuth.verifyIdToken.mockResolvedValue({ uid: 'user123' });
    mockDocRef.get.mockResolvedValue({ exists: true, data: () => ({ isActive: false, username: 'testuser' }) });
    mockDocRef.set.mockResolvedValue(undefined);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockDocRef.set).toHaveBeenCalledWith({ isActive: true }, { merge: true });
  });

  it('should set isActive=true if user document exists without isActive property', async () => {
    const { context } = createMockContext('Bearer valid-token');
    mockAuth.verifyIdToken.mockResolvedValue({ uid: 'user123' });
    mockDocRef.get.mockResolvedValue({ exists: true, data: () => ({ username: 'testuser' }) });
    mockDocRef.set.mockResolvedValue(undefined);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockDocRef.set).toHaveBeenCalledWith({ isActive: true }, { merge: true });
  });

  it('should take no action if isActive is already true', async () => {
    const { context } = createMockContext('Bearer valid-token');
    mockAuth.verifyIdToken.mockResolvedValue({ uid: 'user123' });
    mockDocRef.get.mockResolvedValue({ exists: true, data: () => ({ isActive: true, username: 'testuser' }) });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockDocRef.set).not.toHaveBeenCalled();
  });
});
