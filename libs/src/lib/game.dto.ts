export interface GameDto {
  season: number;
  awayTeam: string;
  homeTeam: string;
  kickoffTime: string; // ISO string for serialization
  week: number;
  winner?: string | null;
}
