import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { GamesService } from '../games/games.service';
import { PicksService } from '../picks/picks.service';
import * as admin from 'firebase-admin';

const mockListUsers = jest.fn();
const mockCollectionGet = jest.fn();

const mockAuth = {
  listUsers: mockListUsers,
};

const mockFirestore = {
  collection: jest.fn().mockReturnValue({
    get: mockCollectionGet,
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

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let mockGamesService: Partial<GamesService>;
  let mockPicksService: Partial<PicksService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockGamesService = {
      getGames: jest.fn().mockResolvedValue([
        {
          season: 2024,
          week: 1,
          awayTeam: 'Lions',
          homeTeam: 'Chiefs',
          kickoffTime: '2024-09-05T20:20:00Z',
          winner: 'Lions',
        },
      ]),
    };

    mockPicksService = {
      getLeaguePicks: jest.fn().mockResolvedValue([
        {
          user: 'user-active-1',
          season: 2024,
          week: 1,
          awayTeam: 'Lions',
          homeTeam: 'Chiefs',
          pickWinner: 'Lions',
        },
        {
          user: 'user-inactive-2',
          season: 2024,
          week: 1,
          awayTeam: 'Lions',
          homeTeam: 'Chiefs',
          pickWinner: 'Chiefs',
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: GamesService, useValue: mockGamesService },
        { provide: PicksService, useValue: mockPicksService },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
  });

  it('should include ONLY users whose Firestore document has isActive=true', async () => {
    mockListUsers.mockResolvedValue({
      users: [
        { uid: 'user-active-1', email: 'active1@example.com', displayName: 'Active User 1' },
        { uid: 'user-inactive-2', email: 'inactive2@example.com', displayName: 'Inactive User 2' },
        { uid: 'user-missing-flag-3', email: 'missing3@example.com', displayName: 'Missing Flag User 3' },
        { uid: 'user-no-doc-4', email: 'nodoc4@example.com', displayName: 'No Doc User 4' },
      ],
    });

    const mockDocs = [
      {
        id: 'user-active-1',
        data: () => ({ isActive: true, username: 'active_one' }),
      },
      {
        id: 'user-inactive-2',
        data: () => ({ isActive: false, username: 'inactive_two' }),
      },
      {
        id: 'user-missing-flag-3',
        data: () => ({ username: 'missing_three' }),
      },
    ];

    mockCollectionGet.mockResolvedValue({
      forEach: (callback: (doc: any) => void) => mockDocs.forEach(callback),
    });

    const result = await service.getLeaderboard(1, {
      id: 'user-active-1',
      email: 'active1@example.com',
    });

    expect(result.leaderboard).toHaveLength(1);
    expect(result.leaderboard[0].user).toEqual({
      uid: 'user-active-1',
      displayName: 'active_one',
      email: 'active1@example.com',
    });
    expect(result.leaderboard[0].wins).toBe(1);
    expect(result.leaderboard[0].losses).toBe(0);
  });

  it('should exclude user if isActive is false or missing in Firestore', async () => {
    mockListUsers.mockResolvedValue({
      users: [
        { uid: 'user-1', email: 'user1@example.com' },
        { uid: 'user-2', email: 'user2@example.com' },
      ],
    });

    const mockDocs = [
      {
        id: 'user-1',
        data: () => ({ isActive: false }),
      },
      {
        id: 'user-2',
        data: () => ({}),
      },
    ];

    mockCollectionGet.mockResolvedValue({
      forEach: (callback: (doc: any) => void) => mockDocs.forEach(callback),
    });

    const result = await service.getLeaderboard(1, {
      id: 'user-1',
      email: 'user1@example.com',
    });

    expect(result.leaderboard).toHaveLength(0);
  });
});
