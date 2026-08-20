import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import * as admin from 'firebase-admin';

const mockDoc = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockCollection = {
  doc: jest.fn(() => mockDoc),
  get: jest.fn(),
};

const mockBatch = {
  set: jest.fn(),
  commit: jest.fn(),
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: () => ({
    collection: jest.fn(() => mockCollection),
    batch: jest.fn(() => mockBatch),
  }),
}));

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('activateUser', () => {
    it('should set isActive to true on the user document', async () => {
      mockDoc.set.mockResolvedValue(undefined);

      await service.activateUser('user-123');

      expect(mockCollection.doc).toHaveBeenCalledWith('user-123');
      expect(mockDoc.set).toHaveBeenCalledWith(
        { isActive: true },
        { merge: true }
      );
    });
  });

  describe('getUsername', () => {
    it('should auto-activate user if document does not exist and return null', async () => {
      mockDoc.get
        .mockResolvedValueOnce({
          exists: false,
          data: () => undefined,
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ isActive: true }),
        });
      mockDoc.set.mockResolvedValue(undefined);

      const username = await service.getUsername('user-123');

      expect(mockDoc.set).toHaveBeenCalledWith(
        { isActive: true },
        { merge: true }
      );
      expect(username).toBeNull();
    });

    it('should return username and not re-activate if user is already active', async () => {
      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({ username: 'TestUser', isActive: true }),
      });

      const username = await service.getUsername('user-123');

      expect(mockDoc.set).not.toHaveBeenCalled();
      expect(username).toBe('TestUser');
    });

    it('should activate user and return username if user document exists but isActive is missing or false', async () => {
      mockDoc.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ username: 'InactiveUser', isActive: false }),
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ username: 'InactiveUser', isActive: true }),
        });
      mockDoc.set.mockResolvedValue(undefined);

      const username = await service.getUsername('user-123');

      expect(mockDoc.set).toHaveBeenCalledWith(
        { isActive: true },
        { merge: true }
      );
      expect(username).toBe('InactiveUser');
    });
  });

  describe('setUsername', () => {
    it('should set username and isActive to true', async () => {
      mockDoc.set.mockResolvedValue(undefined);

      await service.setUsername('user-123', 'NewUsername');

      expect(mockCollection.doc).toHaveBeenCalledWith('user-123');
      expect(mockDoc.set).toHaveBeenCalledWith(
        { username: 'NewUsername', isActive: true },
        { merge: true }
      );
    });
  });

  describe('deactivateAllUsers', () => {
    it('should return 0 deactivated count if users collection is empty', async () => {
      mockCollection.get.mockResolvedValue({
        empty: true,
        docs: [],
        size: 0,
      });

      const result = await service.deactivateAllUsers();

      expect(result).toEqual({ deactivatedCount: 0 });
    });

    it('should set isActive to false on all user documents in batch', async () => {
      const doc1Ref = { id: 'user-1' };
      const doc2Ref = { id: 'user-2' };
      mockCollection.get.mockResolvedValue({
        empty: false,
        size: 2,
        docs: [{ ref: doc1Ref }, { ref: doc2Ref }],
      });
      mockBatch.commit.mockResolvedValue(undefined);

      const result = await service.deactivateAllUsers();

      expect(mockBatch.set).toHaveBeenCalledWith(doc1Ref, { isActive: false }, { merge: true });
      expect(mockBatch.set).toHaveBeenCalledWith(doc2Ref, { isActive: false }, { merge: true });
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(result).toEqual({ deactivatedCount: 2 });
    });
  });
});
