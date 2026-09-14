import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaderboardComponent } from './leaderboard.component';
import { AuthService } from '../auth.service';
import { ApiService } from '../api.service';
import { GameDto } from 'libs';
import { of } from 'rxjs';

describe('LeaderboardComponent', () => {
  let component: LeaderboardComponent;
  let fixture: ComponentFixture<LeaderboardComponent>;
  let apiService: ApiService;

  beforeEach(async () => {
    const apiServiceMock = {
      get: jest.fn().mockImplementation((path: string) => {
        if (path === 'games') return of([]);
        if (path.startsWith('leaderboard')) return of({ week: 1, games: [], leaderboard: [] });
        return of(null);
      }),
    };

    const authServiceMock = {
      user: { uid: 'user1' },
    };

    await TestBed.configureTestingModule({
      imports: [LeaderboardComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should cancel previous request subscription on rapid week changes and keep state synced with latest week', () => {
    component.minWeek = 1;
    component.maxWeek = 5;
    component.selectedWeek = 1;

    let week1Subscribed = false;
    let week1Unsubscribed = false;
    let week2Subscribed = false;

    (apiService.get as jest.Mock).mockImplementation((path: string) => {
      if (path.endsWith('week=1')) {
        return {
          subscribe: (observer: any) => {
            week1Subscribed = true;
            return {
              unsubscribe: () => {
                week1Unsubscribed = true;
              },
            };
          },
        } as any;
      }
      if (path.endsWith('week=2')) {
        return {
          subscribe: (observer: any) => {
            week2Subscribed = true;
            if (typeof observer === 'function') {
              observer({
                week: 2,
                games: [],
                leaderboard: [{ wins: 1, losses: 0, user: { uid: '123' }, picks: [] }],
              });
            } else if (observer && observer.next) {
              observer.next({
                week: 2,
                games: [],
                leaderboard: [{ wins: 1, losses: 0, user: { uid: '123' }, picks: [] }],
              });
            }
            return { unsubscribe: () => {} };
          },
        } as any;
      }
      return of(null);
    });

    component.loadLeaderboard();
    expect(week1Subscribed).toBe(true);

    component.goToNextWeek(); // selectedWeek = 2
    expect(week1Unsubscribed).toBe(true);
    expect(week2Subscribed).toBe(true);

    expect(component.selectedWeek).toBe(2);
    expect(component.leaderboardData?.week).toBe(2);
    expect(component.isLoading).toBe(false);
  });

  it('should format the game tooltip correctly', () => {
    const game: GameDto = {
      id: '1',
      week: 1,
      awayTeam: 'NYG',
      homeTeam: 'DAL',
      kickoffTime: '2025-09-08T00:20:00.000Z',
      winner: undefined,
      awayTeamScore: undefined,
      homeTeamScore: undefined,
    };
    const expectedTooltip = 'Sunday, September 7, 8:20 PM ET';
    const tooltip = component.getGameTooltip(game);
    expect(tooltip).toEqual(expectedTooltip);
  });
});
