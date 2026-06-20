import React, { useState } from "react";
import { Download, Copy, Check, Terminal, FileCode } from "lucide-react";

export default function PythonExporter() {
  const [copied, setCopied] = useState(false);

  const pythonCode = `#!/usr/bin/env python3
"""
Sher aur Bakri (Tiger and Goats) - A Traditional Board Game
Implemented in Pygame with a beautiful wooden board GUI.

Rules:
1. Tiger (Sher) starts at the top-left corner (Point 0).
2. 7 Goats (Bakri) start placed on the opposite triangular base (Points 12-18).
3. Tiger moves first, and turns alternate.
4. Goats can move 1 step along any connected line to an adjacent empty vertex. Goats cannot capture or jump.
5. Tiger can move 1 step to an adjacent empty vertex, or jump over a Goat along a straight linear path to an empty vertex behind it to captured/eat the Goat.
6. Chain Defense: Two consecutive Goats protect each other because there is no empty landing spot for the Tiger.
7. Goats Win: If they completely block and surround the Tiger (0 legal moves/jumps).
8. Tiger Wins: If the Tiger eats enough Goats so that remaining Goats < 4 (not enough to trap the Tiger).
"""

import sys
import math
import pygame

# Initialize Pygame
pygame.init()
pygame.display.set_caption("Sher aur Bakri (Tiger and Goats)")

# Board Dimensions and Properties
WIDTH, HEIGHT = 800, 800
FPS = 60

# Colors
COLOR_BG = (245, 238, 225)          # Soft Cream/Parchment Board Background
COLOR_WOOD_DARK = (94, 61, 40)       # Dark Wood Frame
COLOR_LINE = (120, 90, 70)           # Rich Brown Connection Lines
COLOR_VERTEX = (160, 130, 110)       # Small intersection dots
COLOR_TEXT_MAIN = (45, 40, 35)       # Charcoal text
COLOR_TIGER = (215, 55, 40)          # Indian Tiger Crimson Orange
COLOR_TIGER_SHADOW = (140, 30, 20)
COLOR_GOAT = (248, 248, 250)         # Ivory Goats
COLOR_GOAT_BORDER = (110, 120, 130)
COLOR_HOVER = (75, 175, 100)         # Soft Green for valid landing spots
COLOR_SELECT = (235, 175, 50)        # Warm Amber for selection
COLOR_ALERT = (200, 40, 40)

# Screen setup
screen = pygame.display.set_mode((WIDTH, HEIGHT))
clock = pygame.time.Clock()

# --- Board Layout & Coordinates (19-Point Hourglass Grid) ---
# Normalized coordinates relative to center (0,0) with range x:[-1.5, 1.5], y:[-3, 3]
POINTS_NORM = {
    0: (-1.5, -3.0), 1: (-0.5, -3.0), 2: (0.5, -3.0), 3: (1.5, -3.0),  # Row 1 (Top Triangle)
    4: (-1.0, -2.0), 5: (0.0, -2.0),  6: (1.0, -2.0),                  # Row 2
    7: (-0.5, -1.0), 8: (0.5, -1.0),                                   # Row 3
    9: (0.0, 0.0),                                                     # Row 4 (Central Junction Point)
    10: (-0.5, 1.0), 11: (0.5, 1.0),                                   # Row 5 (Bottom Triangle Expansion)
    12: (-1.0, 2.0), 13: (0.0, 2.0),  14: (1.0, 2.0),                  # Row 6
    15: (-1.5, 3.0), 16: (-0.5, 3.0), 17: (0.5, 3.0), 18: (1.5, 3.0)   # Row 7 (Base)
}

# Graph Adjacency representation (the lines of the hourglass grid)
ADJACENCY = {
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
}

# --- Convert Coordinates to Screen Pixel Locations ---
SCALE_X = 175
SCALE_Y = 100
CENTER_X = WIDTH // 2
CENTER_Y = HEIGHT // 2 - 20

def get_screen_pos(pt_idx):
    nx, ny = POINTS_NORM[pt_idx]
    rx = int(CENTER_X + nx * SCALE_X)
    ry = int(CENTER_Y + ny * SCALE_Y)
    return (rx, ry)

# Build distinct connections
UNIQUE_LINES = []
for p1, neighbors in ADJACENCY.items():
    for p2 in neighbors:
        if p1 < p2:
            UNIQUE_LINES.append((p1, p2))

CLICK_RADIUS = 28
PIECE_RADIUS = 22

class SherAurBakri:
    def __init__(self):
        self.tiger_pos = 0
        self.goats = {12, 13, 14, 15, 16, 17, 18}
        self.turn = "TIGER"
        self.selected_point = None
        self.game_over = False
        self.winner = None
        self.move_history = []
        
        self.font_title = pygame.font.SysFont("Verdana", 32, bold=True)
        self.font_status = pygame.font.SysFont("Verdana", 20, bold=True)
        self.font_log = pygame.font.SysFont("Verdana", 14)
        self.font_over = pygame.font.SysFont("Verdana", 48, bold=True)
        self.font_button = pygame.font.SysFont("Verdana", 16, bold=True)

    def get_jump_target(self, start, jump_over):
        pos_start = POINTS_NORM[start]
        pos_over = POINTS_NORM[jump_over]
        dx = pos_over[0] - pos_start[0]
        dy = pos_over[1] - pos_start[1]
        tx = pos_over[0] + dx
        ty = pos_over[1] + dy
        for idx, pos in POINTS_NORM.items():
            if abs(pos[0] - tx) < 0.05 and abs(pos[1] - ty) < 0.05:
                if idx in ADJACENCY[jump_over]:
                    return idx
        return None

    def get_tiger_actions(self):
        simple_moves = []
        jump_moves = []
        for neighbor in ADJACENCY[self.tiger_pos]:
            if neighbor not in self.goats:
                simple_moves.append(neighbor)
            else:
                landing = self.get_jump_target(self.tiger_pos, neighbor)
                if landing is not None:
                    if landing not in self.goats and landing != self.tiger_pos:
                        jump_moves.append({
                            'goat_pos': neighbor,
                            'landing_pos': landing
                        })
        return simple_moves, jump_moves

    def get_goat_actions(self, goat_idx):
        valid_steps = []
        if goat_idx not in self.goats:
            return valid_steps
        for neighbor in ADJACENCY[goat_idx]:
            if neighbor not in self.goats and neighbor != self.tiger_pos:
                valid_steps.append(neighbor)
        return valid_steps

    def check_victory_states(self):
        if len(self.goats) < 4:
            self.game_over = True
            self.winner = "TIGER"
            return
        simple, jumps = self.get_tiger_actions()
        if len(simple) == 0 and len(jumps) == 0:
            self.game_over = True
            self.winner = "GOATS"

    def handle_click(self, mouse_pos):
        if self.game_over:
            return
        clicked_idx = None
        for idx in POINTS_NORM.keys():
            screen_pos = get_screen_pos(idx)
            dist = math.hypot(mouse_pos[0] - screen_pos[0], mouse_pos[1] - screen_pos[1])
            if dist <= CLICK_RADIUS:
                clicked_idx = idx
                break
        if clicked_idx is None:
            self.selected_point = None
            return

        if self.turn == "TIGER":
            if clicked_idx == self.tiger_pos:
                self.selected_point = clicked_idx
            elif self.selected_point == self.tiger_pos:
                simple, jumps = self.get_tiger_actions()
                if clicked_idx in simple:
                    self.move_history.append(f"Tiger: {self.tiger_pos} -> {clicked_idx}")
                    self.tiger_pos = clicked_idx
                    self.selected_point = None
                    self.turn = "GOAT"
                    self.check_victory_states()
                else:
                    for jump in jumps:
                        if clicked_idx == jump['landing_pos']:
                            eaten_goat = jump['goat_pos']
                            self.goats.remove(eaten_goat)
                            self.move_history.append(f"Tiger ate Goat at {eaten_goat}! Jumps {self.tiger_pos} -> {clicked_idx}")
                            self.tiger_pos = clicked_idx
                            self.selected_point = None
                            self.turn = "GOAT"
                            self.check_victory_states()
                            break
                    else:
                        self.selected_point = None

        elif self.turn == "GOAT":
            if clicked_idx in self.goats:
                self.selected_point = clicked_idx
            elif self.selected_point is not None and self.selected_point in self.goats:
                legal_steps = self.get_goat_actions(self.selected_point)
                if clicked_idx in legal_steps:
                    self.goats.remove(self.selected_point)
                    self.goats.add(clicked_idx)
                    self.move_history.append(f"Goat: {self.selected_point} -> {clicked_idx}")
                    self.selected_point = None
                    self.turn = "TIGER"
                    self.check_victory_states()
                else:
                    if clicked_idx in self.goats:
                        self.selected_point = clicked_idx
                    else:
                        self.selected_point = None

    def reset_game(self):
        self.tiger_pos = 0
        self.goats = {12, 13, 14, 15, 16, 17, 18}
        self.turn = "TIGER"
        self.selected_point = None
        self.game_over = False
        self.winner = None
        self.move_history = []

    def draw_board(self, hover_pt=None):
        top_polygon = [
            get_screen_pos(0), get_screen_pos(3),
            get_screen_pos(8), get_screen_pos(9),
            get_screen_pos(7)
        ]
        bottom_polygon = [
            get_screen_pos(9), get_screen_pos(11),
            get_screen_pos(18), get_screen_pos(15),
            get_screen_pos(10)
        ]
        pygame.draw.polygon(screen, (220, 210, 190), top_polygon, 0)
        pygame.draw.polygon(screen, (220, 210, 190), bottom_polygon, 0)
        
        for line in UNIQUE_LINES:
            start_p = get_screen_pos(line[0])
            end_p = get_screen_pos(line[1])
            pygame.draw.line(screen, COLOR_LINE, start_p, end_p, 4)

        for idx in POINTS_NORM.keys():
            pos = get_screen_pos(idx)
            pygame.draw.circle(screen, COLOR_LINE, pos, 8)
            pygame.draw.circle(screen, COLOR_VERTEX, pos, 5)

        if not self.game_over and self.selected_point is not None:
            sel_pos = get_screen_pos(self.selected_point)
            pygame.draw.circle(screen, COLOR_SELECT, sel_pos, PIECE_RADIUS + 5, 3)
            if self.turn == "TIGER" and self.selected_point == self.tiger_pos:
                simple, jumps = self.get_tiger_actions()
                for target in simple:
                    t_pos = get_screen_pos(target)
                    pygame.draw.circle(screen, COLOR_HOVER, t_pos, 10, 3)
                for jump in jumps:
                    t_pos = get_screen_pos(jump['landing_pos'])
                    pygame.draw.circle(screen, COLOR_ALERT, t_pos, 12, 3)
            elif self.turn == "GOAT" and self.selected_point in self.goats:
                legal_targets = self.get_goat_actions(self.selected_point)
                for target in legal_targets:
                    t_pos = get_screen_pos(target)
                    pygame.draw.circle(screen, COLOR_HOVER, t_pos, 10, 3)

        if hover_pt is not None:
            h_pos = get_screen_pos(hover_pt)
            pygame.draw.circle(screen, COLOR_HOVER, h_pos, PIECE_RADIUS + 2, 2)

        for goat_idx in self.goats:
            g_pos = get_screen_pos(goat_idx)
            pygame.draw.circle(screen, (180, 180, 185), (g_pos[0] + 2, g_pos[1] + 2), PIECE_RADIUS)
            pygame.draw.circle(screen, COLOR_GOAT, g_pos, PIECE_RADIUS)
            pygame.draw.circle(screen, COLOR_GOAT_BORDER, g_pos, PIECE_RADIUS, 2)

        t_pos = get_screen_pos(self.tiger_pos)
        pygame.draw.circle(screen, COLOR_TIGER_SHADOW, (t_pos[0] + 3, t_pos[1] + 3), PIECE_RADIUS + 1)
        pygame.draw.circle(screen, COLOR_TIGER, t_pos, PIECE_RADIUS + 1)
        pygame.draw.circle(screen, COLOR_SELECT, t_pos, PIECE_RADIUS - 4, 2)

    def draw_hud(self):
        title_surf = self.font_title.render("SHER AUR BAKRI", True, COLOR_TEXT_MAIN)
        title_rect = title_surf.get_rect(center=(WIDTH // 2, 45))
        screen.blit(title_surf, title_rect)
        pygame.draw.rect(screen, COLOR_WOOD_DARK, (50, 100, WIDTH - 100, HEIGHT - 220), 4)

        status_y = HEIGHT - 95
        pygame.draw.rect(screen, (230, 225, 215), (50, status_y, WIDTH - 100, 65), 0)
        pygame.draw.rect(screen, COLOR_WOOD_DARK, (50, status_y, WIDTH - 100, 65), 2)

        txt_turn = self.font_status.render(f"TURN: {self.turn}", True, COLOR_TIGER if self.turn == "TIGER" else COLOR_WOOD_DARK)
        txt_goats = self.font_status.render(f"ACTIVE GOATS: {len(self.goats)} / 7", True, COLOR_TEXT_MAIN)
        txt_eaten = self.font_status.render(f"EATEN: {7 - len(self.goats)}", True, COLOR_ALERT)

        screen.blit(txt_turn, (80, status_y + 20))
        screen.blit(txt_goats, (WIDTH - 420, status_y + 20))
        screen.blit(txt_eaten, (WIDTH - 210, status_y + 20))

    def draw_winner_overlay(self):
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((20, 15, 10, 200))
        screen.blit(overlay, (0, 0))
        dialog_rect = pygame.Rect(150, HEIGHT // 2 - 150, WIDTH - 300, 300)
        pygame.draw.rect(screen, COLOR_BG, dialog_rect, 0)
        pygame.draw.rect(screen, COLOR_WOOD_DARK, dialog_rect, 8)

        ann = "TIGER WINS!" if self.winner == "TIGER" else "GOATS WIN!"
        col = COLOR_ALERT if self.winner == "TIGER" else (40, 150, 60)
        txt_winner = self.font_over.render(ann, True, col)
        screen.blit(txt_winner, txt_winner.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 40)))

        txt_sub = self.font_status.render("Press 'R' for a rematch!", True, COLOR_TEXT_MAIN)
        screen.blit(txt_sub, txt_sub.get_rect(center=(WIDTH // 2, HEIGHT // 2 + 30)))

    def run_game_loop(self):
        running = True
        while running:
            hover_pt = None
            mouse_pos = pygame.mouse.get_pos()
            for idx in POINTS_NORM.keys():
                screen_pos = get_screen_pos(idx)
                if math.hypot(mouse_pos[0] - screen_pos[0], mouse_pos[1] - screen_pos[1]) <= CLICK_RADIUS:
                    hover_pt = idx
                    break
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    self.handle_click(event.pos)
                elif event.type == pygame.KEYDOWN and event.key == pygame.K_r:
                    self.reset_game()

            screen.fill((54, 42, 34))
            self.draw_board(hover_pt)
            self.draw_hud()
            if self.game_over:
                self.draw_winner_overlay()
            pygame.display.flip()
            clock.tick(FPS)
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = SherAurBakri()
    game.run_game_loop()
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPythonFile = () => {
    const blob = new Blob([pythonCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sher_aur_bakri.py";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="python_exporter" className="bg-stone-900 text-stone-100 rounded-2xl p-6 shadow-xl border border-stone-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-emerald-400" id="terminal_icon" />
          <div>
            <h2 className="text-lg font-bold font-sans tracking-tight text-white flex items-center gap-1">
              Pygame Executable Script
            </h2>
            <p className="text-xs text-stone-400">Run the high-performance local game with customized graphics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 active:scale-95 transition-all text-stone-200 border border-stone-700"
            title="Copy script code"
            id="copy_code_btn"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Source
              </>
            )}
          </button>
          <button
            onClick={downloadPythonFile}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 transition-all shadow-md shadow-emerald-950/40"
            id="download_code_btn"
          >
            <Download className="w-3.5 h-3.5" />
            Download .py File
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800/80 text-xs text-stone-300">
          <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
            <FileCode className="w-4 h-4" />
            How to run this file locally:
          </span>
          <ol className="list-decimal pl-5 space-y-1 text-stone-400">
            <li>Ensure you have Python installed (Python 3.8+ recommended).</li>
            <li>
              Install the Pygame library by running in your termimal: <code className="bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded font-mono text-emerald-300">pip install pygame</code>
            </li>
            <li>Download the file and run it: <code className="bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded font-mono text-emerald-300">python sher_aur_bakri.py</code></li>
            <li>Press <code className="font-mono text-amber-400">R</code> anytime in the game to restart.</li>
          </ol>
        </div>

        {/* Code Container */}
        <div className="relative">
          <div className="absolute top-3 right-3 text-xs font-mono text-stone-500 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
            pygame
          </div>
          <pre className="p-4 bg-stone-950 rounded-xl max-h-[350px] overflow-y-auto text-xs font-mono text-stone-300 border border-stone-800 scrollbar-thin scrollbar-thumb-stone-800">
            {pythonCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
