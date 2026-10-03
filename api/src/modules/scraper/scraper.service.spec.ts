import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { NflScraperService } from './scraper.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NflScraperService', () => {
  let service: NflScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NflScraperService],
    }).compile();

    service = module.get<NflScraperService>(NflScraperService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scrapeESPN', () => {
    it('should fetch and parse ESPN scoreboard data', async () => {
      const mockEspnResponse = {
        data: {
          events: [
            {
              status: { type: { name: 'STATUS_FINAL' } },
              competitions: [
                {
                  competitors: [
                    { homeAway: 'home', team: { abbreviation: 'KC' }, score: '27' },
                    { homeAway: 'away', team: { abbreviation: 'BAL' }, score: '20' },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockEspnResponse);

      const results = await service['scrapeESPN'](1, 2024, 'REG');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2024&seasontype=2&week=1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Encoding': 'gzip, deflate, br',
            Accept: 'application/json',
          }),
        })
      );

      expect(results).toEqual([
        {
          homeTeam: 'KC',
          awayTeam: 'BAL',
          homeScore: 27,
          awayScore: 20,
          winner: 'KC',
          status: 'FINAL',
        },
      ]);
    });

    it('should handle ESPN errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      const results = await service['scrapeESPN'](1, 2024, 'REG');
      expect(results).toEqual([]);
    });
  });

  describe('consecutive timeout error escalating logger', () => {
    let warnSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(service['logger'], 'warn').mockImplementation();
      errorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();
    });

    it('should log WARN for 1st and 2nd timeouts, and ERROR on 3rd timeout', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
        stack: 'Error: timeout...',
      };

      mockedAxios.get.mockRejectedValueOnce(timeoutError);
      await service['scrapeESPN'](1, 2024, 'REG');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Transient timeout scraping ESPN (Consecutive failure #1/3)'),
        timeoutError.stack
      );
      expect(errorSpy).not.toHaveBeenCalled();

      warnSpy.mockClear();
      errorSpy.mockClear();

      mockedAxios.get.mockRejectedValueOnce(timeoutError);
      await service['scrapeESPN'](1, 2024, 'REG');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Transient timeout scraping ESPN (Consecutive failure #2/3)'),
        timeoutError.stack
      );
      expect(errorSpy).not.toHaveBeenCalled();

      warnSpy.mockClear();
      errorSpy.mockClear();

      mockedAxios.get.mockRejectedValueOnce(timeoutError);
      await service['scrapeESPN'](1, 2024, 'REG');

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scraper failed consecutively 3 times for ESPN'),
        timeoutError.stack
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should work across NFL and CBS scrapers as well', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
        stack: 'Error: timeout...',
      };

      // Test NFL timeouts
      mockedAxios.get.mockRejectedValueOnce(timeoutError);
      await service['scrapeNFL'](1, 2024, 'REG');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Transient timeout scraping NFL (Consecutive failure #1/3)'),
        timeoutError.stack
      );

      // Test CBS timeouts
      warnSpy.mockClear();
      mockedAxios.get.mockRejectedValueOnce(timeoutError);
      await service['scrapeCBS'](1, 2024, 'REG');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Transient timeout scraping CBS (Consecutive failure #1/3)'),
        timeoutError.stack
      );
    });

    it('should reset consecutive failure counter on successful response', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
        stack: 'Error: timeout...',
      };

      // 2 consecutive timeouts
      mockedAxios.get.mockRejectedValueOnce(timeoutError);
      await service['scrapeESPN'](1, 2024, 'REG');
      mockedAxios.get.mockRejectedValueOnce(timeoutError);
      await service['scrapeESPN'](1, 2024, 'REG');

      expect(service['consecutiveFailures'].espn).toBe(2);

      // Successful fetch
      mockedAxios.get.mockResolvedValueOnce({ data: { events: [] } });
      await service['scrapeESPN'](1, 2024, 'REG');

      expect(service['consecutiveFailures'].espn).toBe(0);

      // Next timeout should be failure #1 again
      warnSpy.mockClear();
      errorSpy.mockClear();

      mockedAxios.get.mockRejectedValueOnce(timeoutError);
      await service['scrapeESPN'](1, 2024, 'REG');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Transient timeout scraping ESPN (Consecutive failure #1/3)'),
        timeoutError.stack
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should immediately log ERROR for non-timeout failures without incrementing counter', async () => {
      const nonTimeoutError = {
        message: '401 Unauthorized',
        stack: 'Error: 401...',
      };

      mockedAxios.get.mockRejectedValueOnce(nonTimeoutError);
      await service['scrapeESPN'](1, 2024, 'REG');

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Critical error scraping ESPN: 401 Unauthorized'),
        nonTimeoutError.stack
      );
      expect(warnSpy).not.toHaveBeenCalled();
      expect(service['consecutiveFailures'].espn).toBe(0);
    });
  });

  describe('scrapeNFL', () => {
    it('should fetch and parse NFL scoreboard HTML if __INITIAL_DATA__ present', async () => {
      const mockGameData = {
        page: {
          content: {
            games: [
              {
                homeTeam: { abbreviation: 'KC' },
                visitorTeam: { abbreviation: 'BAL' },
                homeTeamScore: 27,
                visitorTeamScore: 20,
                gameStatus: 'FINAL',
              },
            ],
          },
        },
      };

      const html = `<html><body><script>window.__INITIAL_DATA__ = ${JSON.stringify(mockGameData)};</script></body></html>`;
      mockedAxios.get.mockResolvedValueOnce({ data: html });

      const results = await service['scrapeNFL'](1, 2024, 'REG');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.nfl.com/scores/2024/REG1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Encoding': 'gzip, deflate, br',
          }),
        })
      );

      expect(results).toEqual([
        {
          homeTeam: 'KC',
          awayTeam: 'BAL',
          homeScore: 27,
          awayScore: 20,
          winner: 'KC',
          status: 'FINAL',
        },
      ]);
    });

    it('should handle missing __INITIAL_DATA__ gracefully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: '<html><body>No data</body></html>' });

      const results = await service['scrapeNFL'](1, 2024, 'REG');
      expect(results).toEqual([]);
    });
  });

  describe('scrapeCBS', () => {
    it('should fetch and parse CBS scoreboard HTML if INITIAL_STATE present', async () => {
      const mockCBSData = {
        scoreboard: {
          games: [
            {
              home: { team: { abbrev: 'KC' }, score: '27' },
              away: { team: { abbrev: 'BAL' }, score: '20' },
              status: 'final',
            },
          ],
        },
      };

      const html = `<html><body><script>window.INITIAL_STATE = ${JSON.stringify(mockCBSData)};</script></body></html>`;
      mockedAxios.get.mockResolvedValueOnce({ data: html });

      const results = await service['scrapeCBS'](1, 2024, 'REG');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.cbssports.com/nfl/scoreboard/2024/regular/1/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Encoding': 'gzip, deflate, br',
          }),
        })
      );

      expect(results).toEqual([
        {
          homeTeam: 'KC',
          awayTeam: 'BAL',
          homeScore: 27,
          awayScore: 20,
          winner: 'KC',
          status: 'FINAL',
        },
      ]);
    });
  });

  describe('team abbreviation normalization and equality', () => {
    it('should normalize WSH and WAS, and JAC and JAX', () => {
      expect(service.normalizeTeamAbbreviation('WSH')).toBe('WAS');
      expect(service.normalizeTeamAbbreviation('WAS')).toBe('WAS');
      expect(service.normalizeTeamAbbreviation('JAC')).toBe('JAX');
      expect(service.normalizeTeamAbbreviation('JAX')).toBe('JAX');
    });

    it('should treat WAS and WSH as equal', () => {
      expect(service.areTeamsEqual('WAS', 'WSH')).toBe(true);
      expect(service.areTeamsEqual('WSH', 'WAS')).toBe(true);
      expect(service.areTeamsEqual('JAC', 'JAX')).toBe(true);
      expect(service.areTeamsEqual('WAS', 'PHI')).toBe(false);
    });
  });

  describe('getWeekResults', () => {
    it('should aggregate consensus results across scrapers', async () => {
      const mockEspnResponse = {
        data: {
          events: [
            {
              status: { type: { name: 'STATUS_FINAL' } },
              competitions: [
                {
                  competitors: [
                    { homeAway: 'home', team: { abbreviation: 'KC' }, score: '27' },
                    { homeAway: 'away', team: { abbreviation: 'BAL' }, score: '20' },
                  ],
                },
              ],
            },
          ],
        },
      };

      // Mock ESPN
      mockedAxios.get.mockResolvedValueOnce(mockEspnResponse);
      // Mock NFL (fails/empty)
      mockedAxios.get.mockResolvedValueOnce({ data: '<html></html>' });
      // Mock CBS (fails/empty)
      mockedAxios.get.mockResolvedValueOnce({ data: '<html></html>' });

      const consensus = await service.getWeekResults(1, 2024, 'REG');

      expect(consensus).toEqual([
        {
          homeTeam: 'KC',
          awayTeam: 'BAL',
          homeScore: 27,
          awayScore: 20,
          winner: 'KC',
          status: 'FINAL',
          sourcesAgreed: 1,
          isComplete: true,
        },
      ]);
    });
  });
});
