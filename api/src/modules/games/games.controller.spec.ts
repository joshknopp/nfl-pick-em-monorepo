import { Test, TestingModule } from '@nestjs/testing';
import { GameDto } from 'libs';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

describe('GamesController', () => {
  let controller: GamesController;
  let service: GamesService;

  const mockGamesService = {
    getGames: jest.fn(),
    checkForEndedGames: jest.fn(),
    invalidateGamesCache: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: mockGamesService,
        },
      ],
    }).compile();

    controller = module.get<GamesController>(GamesController);
    service = module.get<GamesService>(GamesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkForEndedGames', () => {
    it('should call the service and return the result', async () => {
      const result: GameDto[] = [];
      mockGamesService.checkForEndedGames.mockResolvedValue(result);

      expect(await controller.checkForEndedGames()).toBe(result);
      expect(service.checkForEndedGames).toHaveBeenCalled();
    });
  });

  describe('invalidateGamesCache', () => {
    it('should invalidate the game cache and return a confirmation', async () => {
      mockGamesService.invalidateGamesCache.mockResolvedValue(undefined);

      await expect(controller.invalidateGamesCache()).resolves.toEqual({
        message: 'Games cache invalidated',
      });
      expect(service.invalidateGamesCache).toHaveBeenCalled();
    });
  });
});
