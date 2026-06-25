export class AnalyzeEventDto {
  homeTeam: string;
  awayTeam: string;
  selectionType: 'HOME' | 'DRAW' | 'AWAY';
  odds: number;
}