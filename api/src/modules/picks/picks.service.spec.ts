import { Test, TestingModule } from '@nestjs/testing';
import { PicksService } from './picks.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';

const mockFirestore = {
  collection: jest.fn(),
  where: jest.fn(),
  get: jest.fn(),
  doc: jest.fn(),
  set: jest.fn(),
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: () => mockFirestore,
}));

describe('PicksService', () => {
  let service: PicksService;
  let mockCacheManager: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockCacheManager = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    mockFirestore.collection.mockReturnValue(mockFirestore);
    mockFirestore.where.mockReturnValue(mockFirestore);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PicksService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<PicksService>(PicksService);
  });

  describe('getLeaguePicks', () => {
    it('should return cached league picks if present', async () => {
      const mockPicks = [
        {
          season: 2025,
          week: 1,
          awayTeam: 'ari',
          homeTeam: 'atl',
          pickWinner: 'atl',
          user: 'user-1',
        },
      ];
      mockCacheManager.get.mockResolvedValue(mockPicks);

      const result = await service.getLeaguePicks();

      expect(result).toBe(mockPicks);
      expect(mockCacheManager.get).toHaveBeenCalledWith('picks:all');
      expect(mockFirestore.get).not.toHaveBeenCalled();
    });

    it('should query firestore and cache on cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const mockDocs = [
        {
          data: () => ({
            season: 2025,
            week: 1,
            awayTeam: 'ari',
            homeTeam: 'atl',
            pickWinner: 'atl',
            user: 'user-1',
          }),
        },
      ];
      mockFirestore.get.mockResolvedValue({ docs: mockDocs });

      const result = await service.getLeaguePicks();

      expect(result).toHaveLength(1);
      expect(mockCacheManager.set).toHaveBeenCalledWith('picks:all', result);
    });
  });

  describe('saveUserPick', () => {
    it('should save pick and immediately invalidate picks:all cache', async () => {
      const user = { id: 'user-1' };
      const pickDto = {
        season: 2025,
        week: 1,
        awayTeam: 'ARI',
        homeTeam: 'ATL',
        pickWinner: 'ATL',
      };

      const mockGameDoc = {
        exists: true,
        data: () => ({
          kickoffTime: {
            toDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // future game
          },
        }),
      };

      mockFirestore.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockGameDoc),
        set: mockFirestore.set.mockResolvedValue(undefined),
      });

      const savedPick = await service.saveUserPick(user, pickDto);

      expect(savedPick.pickWinner).toBe('ATL');
      expect(mockCacheManager.del).toHaveBeenCalledWith('picks:all');
    });

    it('should throw BadRequestException if game has already started', async () => {
      const user = { id: 'user-1' };
      const pickDto = {
        season: 2025,
        week: 1,
        awayTeam: 'ARI',
        homeTeam: 'ATL',
        pickWinner: 'ATL',
      };

      const mockGameDoc = {
        exists: true,
        data: () => ({
          kickoffTime: {
            toDate: () => new Date(Date.now() - 60 * 1000), // past game
          },
        }),
      };

      mockFirestore.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockGameDoc),
        set: mockFirestore.set,
      });

      await expect(service.saveUserPick(user, pickDto)).rejects.toThrow(
        BadRequestException
      );
      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });
  });
});
