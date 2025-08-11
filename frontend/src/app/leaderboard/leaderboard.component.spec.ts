import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaderboardComponent } from './leaderboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';
import { GameDto } from 'libs';

describe('LeaderboardComponent', () => {
  let component: LeaderboardComponent;
  let fixture: ComponentFixture<LeaderboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardComponent, HttpClientTestingModule],
      providers: [AuthService],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format the game tooltip correctly', () => {
    const game: GameDto = {
      id: '1',
      week: 1,
      awayTeam: 'NYG',
      homeTeam: 'DAL',
      kickoffTime: '2025-09-08T00:20:00.000Z', // Sunday, Sep 7, 2025 8:20 PM ET
      winner: undefined,
      awayTeamScore: undefined,
      homeTeamScore: undefined,
    };
    const expectedTooltip = 'Sunday, September 7, 8:20 PM ET';
    const tooltip = component.getGameTooltip(game);
    expect(tooltip).toEqual(expectedTooltip);
  });
});
