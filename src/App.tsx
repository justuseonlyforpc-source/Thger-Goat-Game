import React, { useState } from "react";
import GameBoard from "./components/GameBoard";
import RulesPanel from "./components/RulesPanel";
import { GameMode } from "./types";
import { Shield, Target, Users, PlayCircle, BookOpen, RotateCw, Cpu } from "lucide-react";

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>("PASS_AND_PLAY");
  const [activeTab, setActiveTab] = useState<"game" | "rules">("game");
  const [resetCount, setResetCount] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<"BASIC" | "MEDIUM" | "HARD">("MEDIUM");

  const triggerReset = () => {
    setResetCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 font-sans p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-white rounded-[32px] border border-stone-200/80 shadow-2xl shadow-stone-300/40 p-6 sm:p-8 md:p-10 relative overflow-hidden flex flex-col gap-8">
        
        {/* Aesthetic Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Traditional-Inspired Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Traditional Indian Board Game
              </span>
            </div>
            <h1 className="text-3xl font-black font-sans tracking-tight text-stone-900" id="main_title">
              Sher aur Bakri <span className="text-stone-400 font-light font-serif">/ Tiger & Goats</span>
            </h1>
            <p className="text-xs text-stone-500">
              A 19-Point Hourglass (Damru) tactical board game of symmetric predation, cunning huddles, and gridlocks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={triggerReset}
              className="flex items-center gap-2 border border-stone-200 bg-stone-50 hover:bg-stone-100 active:scale-95 transition-all text-stone-600 hover:text-stone-950 px-4 py-2 rounded-xl text-xs font-bold"
              id="reset_app_btn"
            >
              <RotateCw className="w-3.5 h-3.5" /> RESTART GAME
            </button>
          </div>
        </div>

        {/* Segmented Mode Selector Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Mode 1 */}
          <button
            onClick={() => {
              setGameMode("PASS_AND_PLAY");
              setActiveTab("game");
            }}
            className={`flex items-start gap-3.5 p-4 rounded-2xl text-left border transition-all ${
              gameMode === "PASS_AND_PLAY"
                ? "bg-amber-50 border-amber-300/80 shadow-md ring-1 ring-amber-400/20"
                : "bg-stone-50/50 border-stone-200 hover:bg-stone-50"
            }`}
            id="mode_pass_and_play"
          >
            <div className={`p-2.5 rounded-xl border ${gameMode === "PASS_AND_PLAY" ? "bg-amber-100 border-amber-200 text-amber-800" : "bg-white border-stone-200 text-stone-500"}`}>
              <Users className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-stone-900 block">Pass & Play</span>
              <span className="text-[10px] text-stone-500 block leading-tight">
                Two local players control opposing sides on the same device.
              </span>
            </div>
          </button>

          {/* Mode 2 */}
          <button
            onClick={() => {
              setGameMode("VS_AI_GOATS");
              setActiveTab("game");
            }}
            className={`flex items-start gap-3.5 p-4 rounded-2xl text-left border transition-all ${
              gameMode === "VS_AI_GOATS"
                ? "bg-amber-50 border-amber-300/80 shadow-md ring-1 ring-amber-400/20"
                : "bg-stone-50/50 border-stone-200 hover:bg-stone-50"
            }`}
            id="mode_play_tiger"
          >
            <div className={`p-2.5 rounded-xl border ${gameMode === "VS_AI_GOATS" ? "bg-amber-100 border-amber-200 text-amber-700" : "bg-white border-stone-200 text-stone-500"}`}>
              <Target className="w-4 h-4 text-red-600" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-stone-900 block">Play as Tiger</span>
              <span className="text-[10px] text-stone-500 block leading-tight">
                Hunt down the Goats! Computer controls the huddle herd.
              </span>
            </div>
          </button>

          {/* Mode 3 */}
          <button
            onClick={() => {
              setGameMode("VS_AI_TIGER");
              setActiveTab("game");
            }}
            className={`flex items-start gap-3.5 p-4 rounded-2xl text-left border transition-all ${
              gameMode === "VS_AI_TIGER"
                ? "bg-amber-50 border-amber-300/80 shadow-md ring-1 ring-amber-400/20"
                : "bg-stone-50/50 border-stone-200 hover:bg-stone-50"
            }`}
            id="mode_play_goats"
          >
            <div className={`p-2.5 rounded-xl border ${gameMode === "VS_AI_TIGER" ? "bg-amber-100 border-amber-200 text-amber-700" : "bg-white border-stone-200 text-stone-500"}`}>
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-stone-900 block">Play as Goats</span>
              <span className="text-[10px] text-stone-500 block leading-tight">
                Blockade the tiger! Computer controls the roaming tiger.
              </span>
            </div>
          </button>
        </div>

        {/* Difficulty Selector (when playing against computer) */}
        {gameMode !== "PASS_AND_PLAY" && (
          <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in" id="ai_difficulty_selector">
            <div className="space-y-0.5 animate-pulse-subtle">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Cpu className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" /> AI Difficulty Level
              </span>
              <span className="text-[10px] text-stone-500 block leading-tight">
                Select difficulty: Basic makes random errors, Hard is fully tactical.
              </span>
            </div>
            <div className="flex gap-2">
              {(["BASIC", "MEDIUM", "HARD"] as const).map((level) => {
                const label = level === "BASIC" ? "Basic" : level === "MEDIUM" ? "Medium" : "Hard";
                const isSelected = difficulty === level;
                return (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-700/20"
                        : "bg-white hover:bg-stone-100 border border-stone-200 text-stone-600"
                    }`}
                    id={`difficulty_${level.toLowerCase()}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs and Navigation Row */}
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => setActiveTab("game")}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-xs transition-all uppercase tracking-wider ${
              activeTab === "game"
                ? "border-amber-600 text-stone-900 font-bold"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
            id="tab_game"
          >
            <PlayCircle className="w-4 h-4" /> Interactive Arena
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-xs transition-all uppercase tracking-wider ${
              activeTab === "rules"
                ? "border-amber-600 text-stone-900 font-bold"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
            id="tab_rules"
          >
            <BookOpen className="w-4 h-4" /> Rules & Strategy
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="transition-all duration-300">
          {activeTab === "game" && (
            <GameBoard gameMode={gameMode} onResetCount={resetCount} difficulty={difficulty} />
          )}
          {activeTab === "rules" && <RulesPanel />}
        </div>

        {/* Footer / Copyright information */}
        <div className="text-center text-[10px] text-stone-400/80 tracking-wider">
          Traditional Asian Predation Game • Developed with modern React & Tailwind • Clean Mathematics and Vector engine.
        </div>
      </div>
    </div>
  );
}
