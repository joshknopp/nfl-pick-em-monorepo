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
