import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { GamesService } from '../games/games.service';
import { PicksService } from '../picks/picks.service';
import * as admin from 'firebase-admin';

const mockFirestore = {
  collection: jest.fn(),
};

const mockListUsers = jest.fn();

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: () => mockFirestore,
  auth: () => ({
    listUsers: mockListUsers,
  }),
}));

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  const mockGamesService = {
    getGames: jest.fn(),
  };

  const mockPicksService = {
    getLeaguePicks: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: GamesService, useValue: mockGamesService },
        { provide: PicksService, useValue: mockPicksService },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLeaderboard', () => {
    it('should only include active users (isActive === true) in leaderboard', async () => {
      // Setup mock Auth users
      mockListUsers.mockResolvedValue({
        users: [
          { uid: 'user-active', email: 'active@test.com', displayName: 'Active User' },
          { uid: 'user-inactive', email: 'inactive@test.com', displayName: 'Inactive User' },
          { uid: 'user-missing', email: 'missing@test.com', displayName: 'Missing Field User' },
        ],
      });

      // Setup mock Firestore users collection
      const mockUserDocs = [
        {
          id: 'user-active',
          data: () => ({ username: 'ActivePlayer', isActive: true }),
        },
        {
          id: 'user-inactive',
          data: () => ({ username: 'InactivePlayer', isActive: false }),
        },
        {
          id: 'user-missing',
          data: () => ({ username: 'MissingPlayer' }), // missing isActive
        },
      ];

      mockFirestore.collection.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          forEach: (cb: (doc: any) => void) => mockUserDocs.forEach(cb),
        }),
      });

      // Setup mock games and picks
      mockGamesService.getGames.mockResolvedValue([
        {
          season: 2025,
          week: 1,
          awayTeam: 'KC',
          homeTeam: 'BAL',
          kickoffTime: new Date().toISOString(),
          winner: 'KC',
        },
      ]);

      mockPicksService.getLeaguePicks.mockResolvedValue([
        {
          season: 2025,
          week: 1,
          awayTeam: 'KC',
          homeTeam: 'BAL',
          pickWinner: 'KC',
          user: 'user-active',
        },
      ]);

      const result = await service.getLeaderboard(1, { id: 'user-active', email: 'active@test.com' });

      expect(result.week).toBe(1);
      expect(result.leaderboard).toHaveLength(1);
      expect(result.leaderboard[0].user.uid).toBe('user-active');
      expect(result.leaderboard[0].user.displayName).toBe('ActivePlayer');
    });
  });
});
