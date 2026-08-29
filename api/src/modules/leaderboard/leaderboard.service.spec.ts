import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { GamesService } from '../games/games.service';
import { PicksService } from '../picks/picks.service';
import * as admin from 'firebase-admin';

const mockListUsers = jest.fn();
const mockUserDocsGet = jest.fn();

const mockFirestore = {
  collection: jest.fn().mockReturnValue({
    get: mockUserDocsGet,
  }),
};

jest.mock('firebase-admin', () => ({
  auth: () => ({
    listUsers: mockListUsers,
  }),
  firestore: () => mockFirestore,
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
    it('should only include users whose Firestore record has isActive === true', async () => {
      // Mock Firebase Auth users
      mockListUsers.mockResolvedValue({
        users: [
          { uid: 'user-active', email: 'active@example.com', displayName: 'Active User' },
          { uid: 'user-inactive', email: 'inactive@example.com', displayName: 'Inactive User' },
          { uid: 'user-no-flag', email: 'noflag@example.com', displayName: 'No Flag User' },
          { uid: 'user-no-doc', email: 'nodoc@example.com', displayName: 'No Doc User' },
        ],
      });

      // Mock Firestore users collection docs
      const mockDocs = [
        {
          id: 'user-active',
          data: () => ({ isActive: true, username: 'ActiveOne' }),
        },
        {
          id: 'user-inactive',
          data: () => ({ isActive: false, username: 'InactiveOne' }),
        },
        {
          id: 'user-no-flag',
          data: () => ({ username: 'NoFlagOne' }),
        },
      ];
      mockUserDocsGet.mockResolvedValue({
        forEach: (cb: (doc: any) => void) => mockDocs.forEach(cb),
      });

      mockGamesService.getGames.mockResolvedValue([]);
      mockPicksService.getLeaguePicks.mockResolvedValue([]);

      const result = await service.getLeaderboard(1, {
        id: 'user-active',
        email: 'active@example.com',
      });

      expect(result.leaderboard).toHaveLength(1);
      expect(result.leaderboard[0].user.uid).toBe('user-active');
      expect(result.leaderboard[0].user.displayName).toBe('ActiveOne');
    });
  });
});
