export interface SerializableGame {
  season: number;
  week: number;
  awayTeam: string;
  homeTeam: string;
}

export function serializeGame(game: SerializableGame): string {
  const season = game.season;
  const week = String(game.week).padStart(2, '0');
  const away = game.awayTeam.toLowerCase();
  const home = game.homeTeam.toLowerCase();
  return `${season}-${week}-${away}-at-${home}`;
}
