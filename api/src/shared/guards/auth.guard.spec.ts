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

  it('should set isActive=true directly on user document without reading first', async () => {
    const { context, request } = createMockContext('Bearer valid-token');
    mockAuth.verifyIdToken.mockResolvedValue({ uid: 'user123', email: 'user@example.com' });
    mockDocRef.set.mockResolvedValue(undefined);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ id: 'user123', uid: 'user123', email: 'user@example.com' });
    expect(mockFirestore.collection).toHaveBeenCalledWith('users');
    expect(mockFirestore.collection('users').doc).toHaveBeenCalledWith('user123');
    expect(mockDocRef.set).toHaveBeenCalledWith({ isActive: true }, { merge: true });
    expect(mockDocRef.get).not.toHaveBeenCalled();
  });
});
