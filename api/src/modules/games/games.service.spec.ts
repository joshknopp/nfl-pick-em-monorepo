import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { NflScraperService } from '../scraper/scraper.service';
import { Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

const mockFirestore = {
  collection: jest.fn(),
  get: jest.fn(),
  doc: jest.fn(),
  update: jest.fn(),
};

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: () => mockFirestore,
}));


describe('GamesService', () => {
  let service: GamesService;

  const mockNflScraperService = {
    getWeekResults: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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
          },
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

  describe('getGames with filtering', () => {
    it('should only return games that are within the current season range', async () => {
      const today = new Date(2026, 1, 15); // Season 2025: April 1, 2025 to March 31, 2026

      const mockGamesDocs = [
        {
          id: 'game-1',
          data: () => ({
            season: 2025,
            awayTeam: 'ARI',
            homeTeam: 'ATL',
            kickoffTime: { toDate: () => new Date(2025, 8, 10, 13, 0) }, // In-season
            week: 1,
            winner: null,
          }),
        },
        {
          id: 'game-2',
          data: () => ({
            season: 2024,
            awayTeam: 'DAL',
            homeTeam: 'NYG',
            kickoffTime: { toDate: () => new Date(2024, 8, 10, 13, 0) }, // Out of season (too early)
            week: 1,
            winner: 'DAL',
          }),
        },
        {
          id: 'game-3',
          data: () => ({
            season: 2026,
            awayTeam: 'KC',
            homeTeam: 'SF',
            kickoffTime: { toDate: () => new Date(2026, 8, 10, 13, 0) }, // Out of season (too late)
            week: 1,
            winner: null,
          }),
        },
      ];

      mockFirestore.collection.mockReturnValue({
        get: mockFirestore.get.mockResolvedValue({
          docs: mockGamesDocs,
        }),
      } as any);

      const games = await service.getGames(today);

      expect(games).toHaveLength(1);
      expect((games[0] as any).id).toBe('game-1');
      expect(games[0].season).toBe(2025);
    });
  });

  describe('checkForEndedGames', () => {
    it('should do nothing if no games are found', async () => {
      mockFirestore.collection.mockReturnValue({
        get: mockFirestore.get.mockResolvedValue({ docs: [] }),
      } as any);

      const result = await service.checkForEndedGames();

      expect(result).toEqual([]);
      expect(mockNflScraperService.getWeekResults).not.toHaveBeenCalled();
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
      mockFirestore.collection.mockReturnValue({
        get: mockFirestore.get.mockResolvedValue({
          docs: [{ id: gameId, data: () => gameData }],
        }),
        doc: mockFirestore.doc.mockReturnValue({
          update: mockFirestore.update,
        }),
      } as any);

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
  });
});
