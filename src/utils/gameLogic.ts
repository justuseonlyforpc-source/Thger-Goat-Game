import { BoardPoint, JumpMove } from "../types";

export const BOARD_POINTS: Record<number, BoardPoint> = {
  0: { id: 0, x: -1.5, y: -3.0 },
  1: { id: 1, x: -0.5, y: -3.0 },
  2: { id: 2, x: 0.5, y: -3.0 },
  3: { id: 3, x: 1.5, y: -3.0 },
  4: { id: 4, x: -1.0, y: -2.0 },
  5: { id: 5, x: 0.0, y: -2.0 },
  6: { id: 6, x: 1.0, y: -2.0 },
  7: { id: 7, x: -0.5, y: -1.0 },
  8: { id: 8, x: 0.5, y: -1.0 },
  9: { id: 9, x: 0.0, y: 0.0 },
  10: { id: 10, x: -0.5, y: 1.0 },
  11: { id: 11, x: 0.5, y: 1.0 },
  12: { id: 12, x: -1.0, y: 2.0 },
  13: { id: 13, x: 0.0, y: 2.0 },
  14: { id: 14, x: 1.0, y: 2.0 },
  15: { id: 15, x: -1.5, y: 3.0 },
  16: { id: 16, x: -0.5, y: 3.0 },
  17: { id: 17, x: 0.5, y: 3.0 },
  18: { id: 18, x: 1.5, y: 3.0 }
};

export const ADJACENCY: Record<number, number[]> = {
  0: [1, 4],
  1: [0, 2, 4, 5],
  2: [1, 3, 5, 6],
  3: [2, 6],
  4: [0, 1, 5, 7],
  5: [1, 2, 4, 6, 7, 8],
  6: [2, 3, 5, 8],
  7: [4, 5, 8, 9],
  8: [5, 6, 7, 9],
  9: [7, 8, 10, 11],
  10: [9, 11, 12, 13],
  11: [9, 10, 13, 14],
  12: [10, 13, 15, 16],
  13: [10, 11, 12, 14, 16, 17],
  14: [11, 13, 17, 18],
  15: [12, 16],
  16: [12, 13, 15, 17],
  17: [13, 14, 16, 18],
  18: [14, 17]
};

// Distinct line connections for robust board rendering
export const UNIQUE_LINES: [number, number][] = [];
Object.entries(ADJACENCY).forEach(([nodeStr, neighbors]) => {
  const node = parseInt(nodeStr, 10);
  neighbors.forEach((neighbor) => {
    if (node < neighbor) {
      UNIQUE_LINES.push([node, neighbor]);
    }
  });
});

/**
 * Calculates straight-line jump landing target point.
 * Given a starting node and an adjacent node to jump over, returns the ending node if valid, else null.
 */
export function getJumpTarget(start: number, jumpOver: number): number | null {
  const ptStart = BOARD_POINTS[start];
  const ptOver = BOARD_POINTS[jumpOver];
  if (!ptStart || !ptOver) return null;

  // Vector offset
  const dx = ptOver.x - ptStart.x;
  const dy = ptOver.y - ptStart.y;

  // Projected destination coordinates
  const tx = ptOver.x + dx;
  const ty = ptOver.y + dy;

  // Lookup node with these precise coordinates
  for (const [idStr, pt] of Object.entries(BOARD_POINTS)) {
    if (Math.abs(pt.x - tx) < 0.05 && Math.abs(pt.y - ty) < 0.05) {
      const idx = parseInt(idStr, 10);
      // Ensure physical line adjacency exists from jumpOver to target
      if (ADJACENCY[jumpOver]?.includes(idx)) {
        return idx;
      }
    }
  }

  return null;
}

/**
 * Lists all legal moves and capture jumps available for the Tiger
 */
export function getTigerActions(
  tigerPos: number,
  goats: Set<number>
): { simpleMoves: number[]; jumpMoves: JumpMove[] } {
  const simpleMoves: number[] = [];
  const jumpMoves: JumpMove[] = [];

  const neighbors = ADJACENCY[tigerPos] || [];
  for (const neighbor of neighbors) {
    if (!goats.has(neighbor)) {
      // Adjacent node is empty, valid walking step
      simpleMoves.push(neighbor);
    } else {
      // Adjacent node has a goat, check if we can jump cleanly behind it
      const landing = getJumpTarget(tigerPos, neighbor);
      if (landing !== null) {
        // Landing spot must be empty and not the current tiger position
        if (!goats.has(landing) && landing !== tigerPos) {
          jumpMoves.push({
            goatPos: neighbor,
            landingPos: landing
          });
        }
      }
    }
  }

  return { simpleMoves, jumpMoves };
}

/**
 * Lists all legal moves available for a single Goat
 */
export function getGoatActions(
  goatIdx: number,
  tigerPos: number,
  goats: Set<number>
): number[] {
  const validSteps: number[] = [];
  if (!goats.has(goatIdx)) return validSteps;

  const neighbors = ADJACENCY[goatIdx] || [];
  for (const neighbor of neighbors) {
    if (!goats.has(neighbor) && neighbor !== tigerPos) {
      validSteps.push(neighbor);
    }
  }

  return validSteps;
}

/**
 * Smart heuristic rule-based AI algorithm for Goats and Tiger
 */
export function getAITransit(
  turn: "TIGER" | "GOAT",
  tigerPos: number,
  goatsSet: Set<number>,
  isConsecutive?: boolean,
  difficulty: "BASIC" | "MEDIUM" | "HARD" = "HARD"
): { from: number; to: number; captured?: number } | null {
  const goats = Array.from(goatsSet);
  const rand = Math.random();
  const chooseRandom =
    (difficulty === "BASIC" && rand < 0.65) ||
    (difficulty === "MEDIUM" && rand < 0.30);

  if (turn === "TIGER") {
    const { simpleMoves, jumpMoves } = getTigerActions(tigerPos, goatsSet);

    if (chooseRandom) {
      const options: { from: number; to: number; captured?: number }[] = [];
      jumpMoves.forEach((j) => {
        options.push({ from: tigerPos, to: j.landingPos, captured: j.goatPos });
      });
      if (!isConsecutive) {
        simpleMoves.forEach((s) => {
          options.push({ from: tigerPos, to: s });
        });
      }
      if (options.length > 0) {
        const picked = options[Math.floor(Math.random() * options.length)];
        return picked;
      }
    }

    // 1. Prioritize Jump Captures (Eating Goats is always best!)
    if (jumpMoves.length > 0) {
      // Pick first capture, or find one that maximizes mobility afterwards
      let bestJump = jumpMoves[0];
      let maxPostMoves = -1;

      for (const jump of jumpMoves) {
        // Simulate goat eaten
        const simGoats = new Set(goatsSet);
        simGoats.delete(jump.goatPos);
        const { simpleMoves: simSimple, jumpMoves: simJump } = getTigerActions(jump.landingPos, simGoats);
        const totalSim = simSimple.length + simJump.length;
        if (totalSim > maxPostMoves) {
          maxPostMoves = totalSim;
          bestJump = jump;
        }
      }

      return {
        from: tigerPos,
        to: bestJump.landingPos,
        captured: bestJump.goatPos
      };
    }

    if (isConsecutive) {
      // If we are in consecutive capture mode and have no available jump captures, we cannot make any moves.
      return null;
    }

    // 2. Simple Moves scoring
    if (simpleMoves.length > 0) {
      let bestMove = simpleMoves[0];
      let maxScore = -99999;

      for (const move of simpleMoves) {
        // Evaluate: we want moves that:
        // A. Keep us mobile (simulate simple and jump moves at this new spot)
        const simGoats = new Set(goatsSet);
        const { simpleMoves: simSimple, jumpMoves: simJump } = getTigerActions(move, simGoats);
        const mobility = simSimple.length + simJump.length * 3; // Value jumps highly!

        // B. Get closer to the Goats' centroid
        const targetPt = BOARD_POINTS[move];
        let totalDist = 0;
        goats.forEach(g => {
          const gPt = BOARD_POINTS[g];
          totalDist += Math.abs(targetPt.x - gPt.x) + Math.abs(targetPt.y - gPt.y);
        });
        const distPenalty = goats.length > 0 ? (totalDist / goats.length) : 0;

        // C. Slight random noise to feel human
        const noise = Math.random() * 2;

        const score = mobility * 10 - distPenalty * 5 + noise;
        if (score > maxScore) {
          maxScore = score;
          bestMove = move;
        }
      }

      return { from: tigerPos, to: bestMove };
    }

    return null; // Tiger trapped
  } else {
    // --- GOAT AI PLAY ---
    // Compile all legal moves for all active Goats
    const allGoatMoves: { goat: number; target: number }[] = [];
    goats.forEach((goat) => {
      const targets = getGoatActions(goat, tigerPos, goatsSet);
      targets.forEach((target) => {
        allGoatMoves.push({ goat, target });
      });
    });

    if (allGoatMoves.length === 0) return null;

    if (chooseRandom) {
      const picked = allGoatMoves[Math.floor(Math.random() * allGoatMoves.length)];
      return { from: picked.goat, to: picked.target };
    }

    let bestMove = allGoatMoves[0];
    let maxScore = -999999;

    for (const move of allGoatMoves) {
      // Simulate move
      const simGoats = new Set(goatsSet);
      simGoats.delete(move.goat);
      simGoats.add(move.target);

      // Score this state
      let score = 0;

      // Rule A: HIGH PENALTY if this move allows Tiger to eat ANY Goat on the very next turn
      const { jumpMoves: nextTigerJumps } = getTigerActions(tigerPos, simGoats);
      if (nextTigerJumps.length > 0) {
        score -= 2000; // Super critical: keep goats safe!
      }

      // Rule B: Reward if this move reduces Tiger's available steps (blocks/corners it)
      const { simpleMoves: nextTigerSimple, jumpMoves: nextTigerJumpsPost } = getTigerActions(tigerPos, simGoats);
      const tigerMobility = nextTigerSimple.length + nextTigerJumpsPost.length * 5;
      score -= tigerMobility * 150; // Heavily penalize high tiger mobility

      // Rule C: Chain Defense Bonus. Give points if Goats are connected to each other
      let adjacencyBridges = 0;
      Array.from(simGoats).forEach((g) => {
        const neighbors = ADJACENCY[g] || [];
        neighbors.forEach((n) => {
          if (simGoats.has(n)) adjacencyBridges++;
        });
      });
      score += adjacencyBridges * 15; // Support chains!

      // Rule D: Group up. Distance from Goats to Tiger. We want some goats to surround
      const tPt = BOARD_POINTS[tigerPos];
      const gPt = BOARD_POINTS[move.target];
      const distanceToTiger = Math.abs(tPt.x - gPt.x) + Math.abs(tPt.y - gPt.y);
      
      // Moving closer is generally good to form traps, but don't commit suicide
      score += (4 - distanceToTiger) * 10;

      // Small random factor to add natural flavor
      score += Math.random() * 8;

      if (score > maxScore) {
        maxScore = score;
        bestMove = move;
      }
    }

    return { from: bestMove.goat, to: bestMove.target };
  }
}
