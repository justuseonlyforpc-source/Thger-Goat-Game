import React, { useState, useEffect } from "react";
import { 
  BOARD_POINTS, 
  UNIQUE_LINES, 
  getTigerActions, 
  getGoatActions, 
  getAITransit 
} from "../utils/gameLogic";
import { GameMode, PlayerType } from "../types";
import { Trophy, Shield, RefreshCw, Zap, Users, ShieldAlert, Cpu, Volume2, VolumeX } from "lucide-react";
import { playTigerRoar, playGoatBleat, playKillSound, playLockSound } from "../utils/audioSystem";

interface GameBoardProps {
  gameMode: GameMode;
  onResetCount: number;
  difficulty?: "BASIC" | "MEDIUM" | "HARD";
}

export default function GameBoard({ gameMode, onResetCount, difficulty = "MEDIUM" }: GameBoardProps) {
  // Game States
  const [tigerPos, setTigerPos] = useState<number>(0); // Tiger starts at point 0
  const [goats, setGoats] = useState<Set<number>>(new Set<number>([12, 13, 14, 15, 16, 17, 18])); // 7 Goats start at bottom triangle
  const [turn, setTurn] = useState<PlayerType>("TIGER"); // Tiger moves first
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<PlayerType | null>(null);
  const [history, setHistory] = useState<string[]>(["Game started. Tiger starts at corner (0). Goats placed on base."]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [hoveredPointId, setHoveredPointId] = useState<number | null>(null);
  const [consecutiveCapturePos, setConsecutiveCapturePos] = useState<number | null>(null);

  // Mute preference state
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("game_sound_muted");
      return saved === "true";
    }
    return false;
  });

  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextVal = !prev;
      localStorage.setItem("game_sound_muted", String(nextVal));
      return nextVal;
    });
  };

  // Sound Effect: Play goat sound whenever it becomes the goats' turn to move
  useEffect(() => {
    if (turn === "GOAT" && !gameOver) {
      playGoatBleat(isMuted);
    }
  }, [turn, gameOver]);

  // Restart trigger
  useEffect(() => {
    resetGame();
  }, [gameMode, onResetCount]);

  const resetGame = () => {
    setTigerPos(0);
    setGoats(new Set<number>([12, 13, 14, 15, 16, 17, 18]));
    setTurn("TIGER");
    setSelectedPoint(null);
    setGameOver(false);
    setWinner(null);
    setIsThinking(false);
    setConsecutiveCapturePos(null);
    setHistory(["Game restarted. Tiger starts at corner (0). Goats placed on base."]);
  };

  const addToHistory = (msg: string) => {
    setHistory((prev) => [...prev, msg]);
  };

  // Check victory conditions
  const checkVictory = (currentTiger: number, currentGoats: Set<number>): boolean => {
    // 1. Tiger Wins if Goats < 4
    if (currentGoats.size < 4) {
      setGameOver(true);
      setWinner("TIGER");
      addToHistory(`Tiger WINS! Active goats reduced to ${currentGoats.size}. They cannot block the tiger.`);
      return true;
    }

    // 2. Goats Win if Tiger has 0 legal actions (cannot walk and cannot jump)
    const { simpleMoves, jumpMoves } = getTigerActions(currentTiger, currentGoats);
    if (simpleMoves.length === 0 && jumpMoves.length === 0) {
      setGameOver(true);
      setWinner("GOAT");
      addToHistory("Goats WIN! The Tiger has been completely surrounded and locked.");
      playLockSound(isMuted);
      return true;
    }

    return false;
  };

  // AI execution routine
  useEffect(() => {
    if (gameOver) return;

    // Check if current turn is handled by AI
    const isAITurn =
      (gameMode === "VS_AI_TIGER" && turn === "TIGER") ||
      (gameMode === "VS_AI_GOATS" && turn === "GOAT");

    if (isAITurn) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const isConsecutive = consecutiveCapturePos !== null;
        const currentTigerPos = isConsecutive ? consecutiveCapturePos : tigerPos;
        const aiMove = getAITransit(turn, currentTigerPos, goats, isConsecutive, difficulty);

        if (aiMove) {
          if (turn === "TIGER") {
            if (aiMove.captured !== undefined) {
              const updatedGoats = new Set<number>(goats);
              updatedGoats.delete(aiMove.captured);
              setGoats(updatedGoats);
              setTigerPos(aiMove.to);
              addToHistory(`🤖 Tiger (AI) jumps ${aiMove.from} → ${aiMove.to}, eating Goat at ${aiMove.captured}`);
              playKillSound(isMuted);
              
              // Evaluate if there's any available consecutive jump capture from the landing position
              const { jumpMoves: nextJumps } = getTigerActions(aiMove.to, updatedGoats);
              if (nextJumps.length > 0) {
                setConsecutiveCapturePos(aiMove.to);
                checkVictory(aiMove.to, updatedGoats);
                // Turn is retained as TIGER, next tick will execute next capture
              } else {
                setConsecutiveCapturePos(null);
                checkVictory(aiMove.to, updatedGoats);
                setTurn("GOAT");
              }
            } else {
              setTigerPos(aiMove.to);
              addToHistory(`🤖 Tiger (AI) moves ${aiMove.from} → ${aiMove.to}`);
              playTigerRoar(isMuted);
              setConsecutiveCapturePos(null);
              checkVictory(aiMove.to, goats);
              setTurn("GOAT");
            }
            setSelectedPoint(null);
          } else {
            const updatedGoats = new Set<number>(goats);
            updatedGoats.delete(aiMove.from);
            updatedGoats.add(aiMove.to);
            setGoats(updatedGoats);
            addToHistory(`🤖 Goat (AI) moves ${aiMove.from} → ${aiMove.to}`);
            playGoatBleat(isMuted);
            checkVictory(tigerPos, updatedGoats);
            setTurn("TIGER");
            setSelectedPoint(null);
          }
        } else {
          // No move found for AI
          if (turn === "TIGER" && consecutiveCapturePos !== null) {
            // Elegant exit if AI chooses not to or can't continue consecutive capture
            setConsecutiveCapturePos(null);
            setTurn("GOAT");
            setSelectedPoint(null);
          } else {
            if (turn === "TIGER") {
              setGameOver(true);
              setWinner("GOAT");
              addToHistory("Tiger has no legal moves! Goats Win!");
              playLockSound(isMuted);
            } else {
              setGameOver(true);
              setWinner("TIGER");
              addToHistory("Goats have no legal moves! Tiger Wins!");
            }
          }
        }
        setIsThinking(false);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, tigerPos, goats, gameOver, consecutiveCapturePos]);

  // Is human allowed to click
  const isHumanTurn =
    !gameOver &&
    !isThinking &&
    ((gameMode === "VS_AI_TIGER" && turn === "GOAT") ||
      (gameMode === "VS_AI_GOATS" && turn === "TIGER") ||
      gameMode === "PASS_AND_PLAY");

  // Get active highlighted destinations for the selected piece
  const getHighlights = (): { simple: number[]; jumps: number[] } => {
    if (selectedPoint === null) return { simple: [], jumps: [] };

    if (turn === "TIGER" && selectedPoint === tigerPos) {
      const { simpleMoves, jumpMoves } = getTigerActions(tigerPos, goats);
      if (consecutiveCapturePos !== null) {
        return {
          simple: [],
          jumps: jumpMoves.map((j) => j.landingPos)
        };
      }
      return {
        simple: simpleMoves,
        jumps: jumpMoves.map((j) => j.landingPos)
      };
    }

    if (turn === "GOAT" && goats.has(selectedPoint)) {
      return {
        simple: getGoatActions(selectedPoint, tigerPos, goats),
        jumps: []
      };
    }

    return { simple: [], jumps: [] };
  };

  const { simple: highlightedSimple, jumps: highlightedJumps } = getHighlights();

  // Mouse selection handler
  const handlePointClick = (id: number) => {
    if (!isHumanTurn) return;

    if (turn === "TIGER") {
      const isConsecutive = consecutiveCapturePos !== null;
      const { simpleMoves, jumpMoves } = getTigerActions(tigerPos, goats);

      if (id === tigerPos) {
        // Selection/toggle highlight
        setSelectedPoint(id);
      } else if (!isConsecutive && simpleMoves.includes(id)) {
        // Simple step directly
        setTigerPos(id);
        addToHistory(`Tiger moves ${tigerPos} → ${id}`);
        playTigerRoar(isMuted);
        checkVictory(id, goats);
        setTurn("GOAT");
        setSelectedPoint(null);
      } else {
        const matchingJump = jumpMoves.find((j) => j.landingPos === id);
        if (matchingJump) {
          // Eat Goat jump-capture directly!
          const nextGoats = new Set<number>(goats);
          nextGoats.delete(matchingJump.goatPos);
          setGoats(nextGoats);
          setTigerPos(id);
          addToHistory(`Tiger ate Goat at ${matchingJump.goatPos}! Jumps ${tigerPos} → ${id}`);
          playKillSound(isMuted);
          
          // Check for another consecutive capture option
          const { jumpMoves: nextJumps } = getTigerActions(id, nextGoats);
          if (nextJumps.length > 0) {
            setConsecutiveCapturePos(id);
            checkVictory(id, nextGoats);
            setSelectedPoint(id); // Keep selected to see targets
          } else {
            setConsecutiveCapturePos(null);
            checkVictory(id, nextGoats);
            setTurn("GOAT");
            setSelectedPoint(null);
          }
        } else {
          // Keep tiger selected if in consecutive mode so highlights don't vanish on missed clicks
          if (!isConsecutive) {
            setSelectedPoint(null);
          }
        }
      }
    } else {
      // Goat turn
      if (goats.has(id)) {
        // Selecting a Goat
        setSelectedPoint(id);
      } else if (selectedPoint !== null && goats.has(selectedPoint)) {
        // Attempting to move selected goat
        const legalSteps = getGoatActions(selectedPoint, tigerPos, goats);
        if (legalSteps.includes(id)) {
          const nextGoats = new Set<number>(goats);
          nextGoats.delete(selectedPoint);
          nextGoats.add(id);
          setGoats(nextGoats);
          addToHistory(`Goat moves ${selectedPoint} → ${id}`);
          playGoatBleat(isMuted);
          checkVictory(tigerPos, nextGoats);
          setTurn("TIGER");
          setSelectedPoint(null);
        } else {
          // Clicked somewhere invalid, select alternative goat or deselect
          if (goats.has(id)) {
            setSelectedPoint(id);
          } else {
            setSelectedPoint(null);
          }
        }
      }
    }
  };

  // Convert normalized board coordinates to SVG viewport coordinates
  const getSvgCoords = (id: number) => {
    const pt = BOARD_POINTS[id];
    if (!pt) return { x: 0, y: 0 };
    return {
      x: pt.x * 115, // Scale x
      y: pt.y * 105  // Scale y
    };
  };

  // Helper arrays for drawing polygon backgrounds
  const topPolygonPoints = [0, 3, 8, 9, 7].map(id => getSvgCoords(id));
  const bottomPolygonPoints = [9, 11, 18, 15, 10].map(id => getSvgCoords(id));

  return (
    <div id="game_board_container" className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Visual Arena Container */}
      <div className="flex-1 bg-stone-100/60 rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-inner flex flex-col items-center justify-center relative min-h-[500px]">
        {/* Game Turn & Thinking Overlay */}
        <div className="w-full flex items-center justify-between mb-4 bg-white/95 backdrop-blur-sm shadow-sm border border-stone-200/80 px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse capitalize ${turn === "TIGER" ? "bg-red-600" : "bg-neutral-600"}`} />
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 block">Current Turn</span>
              <span className={`font-bold text-sm tracking-wide flex flex-col sm:flex-row sm:items-center gap-2 ${turn === "TIGER" ? "text-red-700" : "text-stone-700"}`}>
                <span className="flex items-center gap-2">
                  {turn === "TIGER" ? "Tiger (Sher)" : "Goats (Bakri)"}
                  {isThinking && (
                    <span className="text-xs font-normal text-stone-400 italic animate-pulse flex items-center gap-1">
                      <Cpu className="w-3 h-3 animate-spin text-amber-500" /> thinking...
                    </span>
                  )}
                </span>
                {consecutiveCapturePos !== null && (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                    Double/Multi Jump!
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono font-bold text-stone-600">
            {consecutiveCapturePos !== null && isHumanTurn && (
              <button
                onClick={() => {
                  setConsecutiveCapturePos(null);
                  setTurn("GOAT");
                  setSelectedPoint(null);
                  addToHistory("Tiger chose to end consecutive turn manually.");
                }}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] transition duration-150 active:scale-95 shadow-sm uppercase tracking-wider border border-amber-600 cursor-pointer"
                id="end_tiger_turn_btn"
              >
                End Turn
              </button>
            )}
            <div className="bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/60 hidden sm:block">
              Goats Left: <span className="text-blue-600">{goats.size}</span>/7
            </div>
            <div className="bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/60">
              Eaten: <span className="text-red-600">{7 - goats.size}</span>/3 limit
            </div>
          </div>
        </div>

        {/* Board Symmetrical SVG */}
        <div className="relative w-full max-w-[420px] aspect-[400/660] bg-gradient-to-b from-stone-50/20 to-stone-100/40 border border-stone-300 rounded-3xl shadow-lg p-2 overflow-hidden flex items-center justify-center">
          <svg
            viewBox="-210 -340 420 680"
            className="w-full h-full select-none"
            style={{ touchAction: "none" }}
          >
            {/* Hourglass/Damru Symmetrical Wooden Backgrounds */}
            <polygon
              points={topPolygonPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              className="fill-amber-50/40 stroke-stone-300 stroke-1"
            />
            <polygon
              points={bottomPolygonPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              className="fill-amber-50/40 stroke-stone-300 stroke-1"
            />

            {/* Grid Connection Lines */}
            {UNIQUE_LINES.map(([fromId, toId], i) => {
              const fromC = getSvgCoords(fromId);
              const toC = getSvgCoords(toId);
              return (
                <line
                  key={`line-${i}`}
                  x1={fromC.x}
                  y1={fromC.y}
                  x2={toC.x}
                  y2={toC.y}
                  className="stroke-stone-500"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Intersection Nodes (Subtle base point markers) */}
            {Object.keys(BOARD_POINTS).map((idStr) => {
              const id = parseInt(idStr, 10);
              const c = getSvgCoords(id);
              return (
                <g key={`vertex-${id}`}>
                  {/* Outer shadow ring */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="8"
                    className="fill-stone-600 cursor-pointer"
                    onMouseEnter={() => setHoveredPointId(id)}
                    onMouseLeave={() => setHoveredPointId(null)}
                    onClick={() => handlePointClick(id)}
                  />
                  {/* Inner ring */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="4"
                    className="fill-stone-300 cursor-pointer pointer-events-none"
                  />
                </g>
              );
            })}

            {/* Glowing Destination Targets (Interactive Helpers) */}
            {highlightedSimple.map((targetId) => {
              const c = getSvgCoords(targetId);
              return (
                <circle
                  key={`highlight-simple-${targetId}`}
                  cx={c.x}
                  cy={c.y}
                  r="14"
                  className="fill-emerald-500/10 stroke-emerald-500 hover:fill-emerald-500/30 cursor-pointer transition-colors duration-200 animate-pulse"
                  strokeWidth="3.5"
                  onClick={() => handlePointClick(targetId)}
                />
              );
            })}

            {highlightedJumps.map((targetId) => {
              const c = getSvgCoords(targetId);
              return (
                <circle
                  key={`highlight-jump-${targetId}`}
                  cx={c.x}
                  cy={c.y}
                  r="15"
                  className="fill-red-500/15 stroke-red-600 hover:fill-red-600/40 cursor-pointer transition-colors duration-200 animate-pulse"
                  strokeWidth="4"
                  onClick={() => handlePointClick(targetId)}
                />
              );
            })}

            {/* Selected glow ring */}
            {selectedPoint !== null && (() => {
              const c = getSvgCoords(selectedPoint);
              return (
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="24"
                  className="fill-none stroke-amber-500 pointer-events-none"
                  strokeWidth="4"
                  strokeDasharray="4,2"
                />
              );
            })()}

            {/* Hovered highlight */}
            {hoveredPointId !== null && (() => {
              const c = getSvgCoords(hoveredPointId);
              return (
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="22"
                  className="fill-none stroke-emerald-400/60 pointer-events-none"
                  strokeWidth="2.5"
                />
              );
            })()}

            {/* DRAW GOATS (Ivory Stones) */}
            {Array.from(goats as Set<number>).map((goatId: number) => {
              const c = getSvgCoords(goatId);
              const isSelected = selectedPoint === goatId;
              return (
                <g
                  key={`goat-${goatId}`}
                  className="cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95"
                  onClick={() => handlePointClick(goatId)}
                >
                  {/* Outer drop shadow */}
                  <circle
                    cx={c.x + 1.5}
                    cy={c.y + 2}
                    r="16"
                    className="fill-stone-900/15"
                  />
                  {/* Ivory stone */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="16"
                    className={`${isSelected ? "fill-amber-50 stroke-amber-500" : "fill-stone-50 stroke-stone-400"} transition-all`}
                    strokeWidth="2.5"
                  />
                  {/* Inner detail rim */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="11"
                    className="fill-none stroke-stone-200/70"
                    strokeWidth="1.5"
                  />
                  {/* Goat Label or Dot */}
                  <text
                    x={c.x}
                    y={c.y + 3.5}
                    textAnchor="middle"
                    className="font-sans font-bold text-[9px] fill-stone-500 pointer-events-none"
                  >
                     G
                  </text>
                </g>
              );
            })}

            {/* DRAW TIGER (Red shield) */}
            {(() => {
              const c = getSvgCoords(tigerPos);
              const isSelected = selectedPoint === tigerPos;
              return (
                <g
                  className="cursor-pointer transition-transform duration-200 hover:scale-110"
                  onClick={() => handlePointClick(tigerPos)}
                  id="tiger_piece"
                >
                  {/* Outer shadow */}
                  <circle
                    cx={c.x + 2}
                    cy={c.y + 2}
                    r="18"
                    className="fill-red-950/25"
                  />
                  {/* Tiger Ring */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="18"
                    className={`${
                      consecutiveCapturePos !== null
                        ? "fill-red-800 stroke-amber-300 animate-pulse"
                        : isSelected
                        ? "fill-red-700 stroke-amber-400"
                        : "fill-red-600 stroke-red-800"
                    }`}
                    strokeWidth="3.5"
                  />
                  {/* Inner Gold ring */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="12"
                    className="fill-none stroke-amber-400"
                    strokeWidth="2"
                  />
                  {/* Inner eye */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="5"
                    className="fill-red-950"
                  />
                  <text
                    x={c.x}
                    y={c.y + 4}
                    textAnchor="middle"
                    className="font-sans font-extrabold text-[10px] fill-white pointer-events-none select-none"
                  >
                    T
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Action Panel / Hint Banner */}
        <div className="mt-4 text-center">
          <p className="text-xs text-stone-500 italic max-w-sm">
            {turn === "TIGER"
              ? "Tiger turn: Select tiger (T) and click green/red dots to step or jump-eat Goats."
              : "Goat turn: Select any Goat (G) and click adjacent green targets to step."}
          </p>
        </div>

        {/* Win Screen Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className={`p-4 rounded-full mb-3 shadow-lg ${winner === "TIGER" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
              <Trophy className="w-12 h-12" />
            </div>
            <h3 className={`text-2xl font-black tracking-wide ${winner === "TIGER" ? "text-red-500" : "text-emerald-500"}`}>
              {winner === "TIGER" ? "TIGER WINS!" : "GOATS WIN!"}
            </h3>
            <p className="text-stone-300 text-sm mt-2 max-w-xs leading-relaxed">
              {winner === "TIGER"
                ? "The tiger ate enough goats to bypass captivity! Safe from containment."
                : "The goats successfully trapped and gridlocked the tiger with zero moves remaining!"}
            </p>
            <button
              onClick={resetGame}
              className="mt-6 flex items-center gap-2 bg-stone-800 border border-stone-700 hover:border-stone-600 hover:bg-stone-700 text-stone-200 hover:text-white font-bold py-2.5 px-6 rounded-xl text-xs transition duration-200 tracking-wider shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" /> REMATCH
            </button>
          </div>
        )}
      </div>

      {/* Battle Log Sidebar */}
      <div className="w-full lg:w-[280px] bg-stone-50 border border-stone-200 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-stone-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Battle Record
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-stone-400 hover:text-amber-600 active:scale-95 transition-all cursor-pointer p-1 rounded-lg hover:bg-stone-100"
                title={isMuted ? "Unmute sound" : "Mute sound"}
                id="sound_mute_toggle"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={resetGame}
                className="text-stone-400 hover:text-stone-600 active:scale-95 transition-all cursor-pointer p-1 rounded-lg hover:bg-stone-100"
                title="Reset Match"
                id="game_board_reset"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrolling History Log Container */}
          <div className="flex-1 overflow-y-auto max-h-[320px] lg:max-h-[380px] space-y-2 pr-1 scrollbar-thin scrollbar-thumb-stone-200">
            {history.slice().reverse().map((msg, idx) => {
              const isTiger = msg.toLowerCase().includes("tiger") || msg.toLowerCase().includes("eating");
              const isAI = msg.includes("🤖");
              return (
                <div
                  key={`log-${idx}`}
                  className={`p-2.5 rounded-xl text-xs leading-normal border text-stone-600 transition-all ${
                    isTiger
                      ? "bg-red-50/50 border-red-100 text-red-900/80"
                      : "bg-stone-100/50 border-stone-200/60"
                  } ${isAI ? "border-dashed" : ""}`}
                >
                  {msg}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom mode action states */}
        <div className="mt-4 pt-4 border-t border-stone-200">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">
            Active Game Mode
          </span>
          <div className="flex items-center gap-2.5 bg-white border border-stone-200/80 p-2.5 rounded-2xl">
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
              {gameMode === "PASS_AND_PLAY" ? (
                <Users className="w-4 h-4" />
              ) : (
                <Cpu className="w-4 h-4" />
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-stone-800 tracking-tight block">
                {gameMode === "PASS_AND_PLAY"
                  ? "Pass & Play"
                  : gameMode === "VS_AI_TIGER"
                  ? "Play Goats (AI Tiger)"
                  : "Play Tiger (AI Goats)"}
              </span>
              <span className="text-[10px] text-stone-400">
                {gameMode === "PASS_AND_PLAY"
                  ? "Local pass-to-play"
                  : "Single player against smart AI"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
