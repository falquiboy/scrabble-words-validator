// Tipos básicos para el Tournament Manager de Duplicada

export interface Tournament {
  id: string;
  name: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  currentRound: number;
  totalRounds: number;
  createdAt: Date;
  adminCode: string;
}

export interface Player {
  id: string;
  name: string;
  tournamentId: string;
  totalScore: number;
  isConnected: boolean;
  lastActivity: Date;
}

export interface TournamentRound {
  id: string;
  tournamentId: string;
  roundNumber: number;
  tiles: string; // Las 7 fichas para esta ronda
  timeLimit: number; // En segundos
  status: 'waiting' | 'active' | 'finished';
  masterSolution?: PlaySolution;
  startedAt?: Date;
  finishedAt?: Date;
}

export interface PlaySolution {
  word: string;
  startRow: number;
  startCol: number;
  direction: 'horizontal' | 'vertical';
  score: number;
  tilesUsed: string;
}

export interface PlayerSubmission {
  id: string;
  playerId: string;
  roundId: string;
  solution?: PlaySolution;
  submittedAt: Date;
  score: number;
  timeTaken: number; // En segundos
}

// Configuración del tablero estándar de Scrabble
export type CellType = 'normal' | 'dw' | 'tw' | 'dl' | 'tl' | 'star';

export interface BoardCell {
  row: number;
  col: number;
  type: CellType;
  tile?: string;
  isFixed: boolean; // true si la ficha ya estaba en el tablero
  isWildcard?: boolean; // true si la ficha es un comodín
}

// Fichas del Scrabble español con sus valores y cantidades
export interface TileInfo {
  letter: string;
  points: number;
  quantity: number;
}