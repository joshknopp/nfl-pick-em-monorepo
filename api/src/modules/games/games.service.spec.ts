import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { NflScraperService } from '../scraper/scraper.service';
import { Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as admin from 'firebase-admin';

const mockFirestore = {
  collection: jest.fn(),
  where: jest.fn(),
  get: jest.fn(),
  doc: jest.fn(),
  update: jest.fn(),
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: Object.assign(() => mockFirestore, {
    Timestamp: {
      fromDate: (date: Date) => date,
    },
  }),
}));

describe('GamesService', () => {
  let service: GamesService;

  const mockNflScraperService = {
    getWeekResults: jest.fn(),
    areTeamsEqual: jest.fn((a, b) => {
      if (!a || !b) return a === b;
      const norm = (s: string) => (s === 'WSH' ? 'WAS' : s === 'JAC' ? 'JAX' : s);
      return norm(a) === norm(b);
    }),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockFirestore.collection.mockReturnValue(mockFirestore);
    mockFirestore.where.mockReturnValue(mockFirestore);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: NflScraperService,
          useValue: mockNflScraperService,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentSeasonRange', () => {
    it('should calculate 2025 season if today is February 15, 2026 (before April 1)', () => {
      const today = new Date(2026, 1, 15); // February 15, 2026 (0-indexed month: 1 = Feb)
      const range = service.getCurrentSeasonRange(today);
      expect(range.season).toBe(2025);
      expect(range.start).toEqual(new Date(2025, 3, 1, 0, 0, 0, 0)); // April 1, 2025
      expect(range.end).toEqual(new Date(2026, 2, 31, 23, 59, 59, 999)); // March 31, 2026
    });

    it('should calculate 2026 season if today is June 20, 2026 (after April 1)', () => {
      const today = new Date(2026, 5, 20); // June 20, 2026 (0-indexed month: 5 = June)
      const range = service.getCurrentSeasonRange(today);
      expect(range.season).toBe(2026);
      expect(range.start).toEqual(new Date(2026, 3, 1, 0, 0, 0, 0)); // April 1, 2026
      expect(range.end).toEqual(new Date(2027, 2, 31, 23, 59, 59, 999)); // March 31, 2027
    });

    it('should calculate 2026 season on the start boundary of April 1, 2026', () => {
      const today = new Date(2026, 3, 1, 12, 0, 0); // April 1, 2026
      const range = service.getCurrentSeasonRange(today);
      expect(range.season).toBe(2026);
      expect(range.start).toEqual(new Date(2026, 3, 1, 0, 0, 0, 0));
    });

    it('should calculate 2025 season on the end boundary of March 31, 2026', () => {
      const today = new Date(2026, 2, 31, 23, 59, 59); // March 31, 2026
      const range = service.getCurrentSeasonRange(today);
      expect(range.season).toBe(2025);
      expect(range.end).toEqual(new Date(2026, 2, 31, 23, 59, 59, 999));
    });
  });

  describe('getGames with caching and filtering', () => {
    it('should return cached games if available', async () => {
      const mockCachedGames = [
        {
          id: 'game-1',
          season: 2025,
          awayTeam: 'ARI',
          homeTeam: 'ATL',
          kickoffTime: new Date(2025, 8, 10, 13, 0).toISOString(),
          week: 1,
          winner: null,
        },
      ];
      mockCacheManager.get.mockResolvedValue(mockCachedGames);

      const games = await service.getGames(new Date(2026, 1, 15));

      expect(games).toBe(mockCachedGames);
      expect(mockCacheManager.get).toHaveBeenCalledWith('games:2025');
      expect(mockFirestore.get).not.toHaveBeenCalled();
    });

    it('should query firestore and cache result on cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const mockGamesDocs = [
        {
          id: 'game-1',
          data: () => ({
            season: 2025,
            awayTeam: 'ARI',
            homeTeam: 'ATL',
            kickoffTime: { toDate: () => new Date(2025, 8, 10, 13, 0) },
            week: 1,
            winner: null,
          }),
        },
      ];

      mockFirestore.get.mockResolvedValue({ docs: mockGamesDocs });

      const today = new Date(2026, 1, 15);
      const games = await service.getGames(today);

      expect(games).toHaveLength(1);
      expect((games[0] as any).id).toBe('game-1');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'games:2025',
        games,
        5 * 24 * 60 * 60 * 1000
      );
    });
  });

  describe('checkForEndedGames', () => {
    it('should do nothing if no games are found', async () => {
      mockFirestore.get.mockResolvedValue({ docs: [] });

      const result = await service.checkForEndedGames();

      expect(result).toEqual([]);
      expect(mockNflScraperService.getWeekResults).not.toHaveBeenCalled();
    });

    it('should match games with WSH vs WAS team abbreviations and update winner using game team representation', async () => {
      const gameId = '2026-01-wsh-at-phi';
      const gameData = {
        season: 2026,
        week: 1,
        awayTeam: 'WSH',
        homeTeam: 'PHI',
        kickoffTime: { toDate: () => new Date(Date.now() - 3 * 60 * 60 * 1000) },
        winner: null,
      };
      mockFirestore.get.mockResolvedValue({
        docs: [{ id: gameId, data: () => gameData }],
      });
      mockFirestore.doc.mockReturnValue({
        update: mockFirestore.update,
      });

      mockNflScraperService.getWeekResults.mockResolvedValue([
        {
          homeTeam: 'PHI',
          awayTeam: 'WAS',
          winner: 'WAS',
        },
      ]);

      const result = await service.checkForEndedGames();

      expect(mockNflScraperService.getWeekResults).toHaveBeenCalledWith(1, 2026);
      expect(mockFirestore.doc).toHaveBeenCalledWith(gameId);
      expect(mockFirestore.update).toHaveBeenCalledWith({ winner: 'WSH' });
      expect(result).toHaveLength(1);
      expect(result[0].winner).toBe('WSH');
    });

    it('should call scraper and update game if winner is found', async () => {
      const gameId = 'test-game-id';
      const gameData = {
        season: 2025,
        week: 1,
        awayTeam: 'ARI',
        homeTeam: 'ATL',
        kickoffTime: { toDate: () => new Date(Date.now() - 3 * 60 * 60 * 1000) },
        winner: null,
      };
      mockFirestore.get.mockResolvedValue({
        docs: [{ id: gameId, data: () => gameData }],
      });
      mockFirestore.doc.mockReturnValue({
        update: mockFirestore.update,
      });

      mockNflScraperService.getWeekResults.mockResolvedValue([
        {
          homeTeam: 'ATL',
          awayTeam: 'ARI',
          winner: 'ATL',
        },
      ]);

      const result = await service.checkForEndedGames();

      expect(mockNflScraperService.getWeekResults).toHaveBeenCalledWith(1, 2025);
      expect(mockFirestore.doc).toHaveBeenCalledWith(gameId);
      expect(mockFirestore.update).toHaveBeenCalledWith({ winner: 'ATL' });
      expect(result).toHaveLength(1);
      expect(result[0].winner).toBe('ATL');
    });

    it('should include games with missing winner field (undefined) and update when scraper finds winner', async () => {
      const gameId = 'missing-winner-game-id';
      const gameData = {
        season: 2025,
        week: 1,
        awayTeam: 'DAL',
        homeTeam: 'NYG',
        kickoffTime: { toDate: () => new Date(Date.now() - 3 * 60 * 60 * 1000) },
        // winner field intentionally omitted/missing
      };
      mockFirestore.get.mockResolvedValue({
        docs: [{ id: gameId, data: () => gameData }],
      });
      mockFirestore.doc.mockReturnValue({
        update: mockFirestore.update,
      });

      mockNflScraperService.getWeekResults.mockResolvedValue([
        {
          homeTeam: 'NYG',
          awayTeam: 'DAL',
          winner: 'DAL',
        },
      ]);

      const result = await service.checkForEndedGames();

      expect(mockNflScraperService.getWeekResults).toHaveBeenCalledWith(1, 2025);
      expect(mockFirestore.doc).toHaveBeenCalledWith(gameId);
      expect(mockFirestore.update).toHaveBeenCalledWith({ winner: 'DAL' });
      expect(result).toHaveLength(1);
      expect(result[0].winner).toBe('DAL');
    });

    it('should ignore games that already have a winner set', async () => {
      const gameId = 'already-ended-game-id';
      const gameData = {
        season: 2025,
        week: 1,
        awayTeam: 'GB',
        homeTeam: 'CHI',
        kickoffTime: { toDate: () => new Date(Date.now() - 3 * 60 * 60 * 1000) },
        winner: 'GB',
      };
      mockFirestore.get.mockResolvedValue({
        docs: [{ id: gameId, data: () => gameData }],
      });

      const result = await service.checkForEndedGames();

      expect(result).toEqual([]);
      expect(mockNflScraperService.getWeekResults).not.toHaveBeenCalled();
    });
  });
});
