import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GamesComponent } from './games.ts';
import { PicksService } from './picks.service';
import { ToastService } from './toast.service';
import { ApiService } from './api.service';
import { GameDto, PickDTO } from 'libs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('GamesComponent', () => {
  let component: GamesComponent;
  let fixture: ComponentFixture<GamesComponent>;
  let picksService: PicksService;
  let toastService: ToastService;

  const mockGame: GameDto = {
    season: 2024,
    week: 1,
    awayTeam: 'Lions',
    homeTeam: 'Chiefs',
    kickoffTime: new Date().toISOString(),
  };

  beforeEach(async () => {
    const picksServiceMock = {
      saveUserPick: jest.fn(),
      getUserPicks: jest.fn().mockReturnValue(of([])),
    };

    const toastServiceMock = {
      show: jest.fn(),
    };

    const apiServiceMock = {
      get: jest.fn().mockReturnValue(of([mockGame])),
    };

    await TestBed.configureTestingModule({
      imports: [GamesComponent],
      providers: [
        { provide: PicksService, useValue: picksServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ApiService, useValue: apiServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GamesComponent);
    component = fixture.componentInstance;
    picksService = TestBed.inject(PicksService);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should revert pick and show error toast on save failure', () => {
    const gameId = component.getGameId(mockGame);
    const initialPick = 'Lions';
    component.picks.set(gameId, initialPick);
    const newPick = 'Chiefs';

    (picksService.saveUserPick as jest.Mock).mockReturnValue(throwError(() => new Error('Save failed')));

    component.onPickChange(mockGame, newPick);

    expect(picksService.saveUserPick).toHaveBeenCalled();
    expect(toastService.show).toHaveBeenCalledWith('Error saving pick. Please try again.', 'error');
    expect(component.picks.get(gameId)).toBe(initialPick);
  });
});
