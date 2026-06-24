export class AnalyzeWithModelDto {
  homeTeamId: number;
  awayTeamId: number;
  selectionType: 'HOME' | 'DRAW' | 'AWAY';
  odds: number;
}