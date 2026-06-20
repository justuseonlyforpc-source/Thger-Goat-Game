export type PlayerType = "TIGER" | "GOAT";

export type GameMode = "VS_AI_TIGER" | "VS_AI_GOATS" | "PASS_AND_PLAY";

export interface Point2D {
  x: number;
  y: number;
}

export interface JumpMove {
  goatPos: number;
  landingPos: number;
}

export interface BoardPoint {
  id: number;
  x: number; // Normalized x coordinate [-1.5, 1.5]
  y: number; // Normalized y coordinate [-3.0, 3.0]
}
