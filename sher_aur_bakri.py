#!/usr/bin/env python3
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

# Mapping points into (col, row) relative structures to define adjacency beautifully
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

# Build a list of all distinct line connections for safe and crisp rendering
UNIQUE_LINES = []
for p1, neighbors in ADJACENCY.items():
    for p2 in neighbors:
        if p1 < p2:
            UNIQUE_LINES.append((p1, p2))

# Radius for drawing pieces and clicking
CLICK_RADIUS = 28
PIECE_RADIUS = 22

class SherAurBakri:
    def __init__(self):
        # Initial positions
        # Tiger starts at point 0 (top-left extreme corner)
        self.tiger_pos = 0
        
        # 7 Goats start placed on the opposite triangular base points (12, 13, 14, 15, 16, 17, 18)
        self.goats = {12, 13, 14, 15, 16, 17, 18}
        
        # Game State Variables
        self.turn = "TIGER"  # TIGER moves first
        self.selected_point = None
        self.game_over = False
        self.winner = None
        self.move_history = []  # Log moves for user visual confirmation
        
        # Fonts
        self.font_title = pygame.font.SysFont("Verdana", 32, bold=True)
        self.font_status = pygame.font.SysFont("Verdana", 20, bold=True)
        self.font_log = pygame.font.SysFont("Verdana", 14)
        self.font_over = pygame.font.SysFont("Verdana", 48, bold=True)
        self.font_button = pygame.font.SysFont("Verdana", 16, bold=True)

    def get_jump_target(self, start, jump_over):
        """
        Determines the landing spot in a straight path from start, jumping over a adjacent piece.
        Returns the index of the landing vertex if it forms a straight line on the hourglass, otherwise None.
        """
        pos_start = POINTS_NORM[start]
        pos_over = POINTS_NORM[jump_over]
        
        # Offset vector of step
        dx = pos_over[0] - pos_start[0]
        dy = pos_over[1] - pos_start[1]
        
        # Projected destination location
        tx = pos_over[0] + dx
        ty = pos_over[1] + dy
        
        # Find if there is a vertex matching these precise coordinates
        for idx, pos in POINTS_NORM.items():
            if abs(pos[0] - tx) < 0.05 and abs(pos[1] - ty) < 0.05:
                # The landing vertex must be connected to jump_over structurally
                if idx in ADJACENCY[jump_over]:
                    return idx
        return None

    def get_tiger_actions(self):
        """
        Calculates all legal actions for the Tiger.
        Returns a tuple: (simple_moves, jump_moves)
        - simple_moves: list of empty adjacent point indices
        - jump_moves: list of dict details: {'goat_pos': X, 'landing_pos': Y}
        """
        simple_moves = []
        jump_moves = []
        
        # Explore each neighbor of Tiger
        for neighbor in ADJACENCY[self.tiger_pos]:
            if neighbor not in self.goats:
                # Vertex is empty, normal 1-step move is possible
                simple_moves.append(neighbor)
            else:
                # Vertex is occupied by a goat, let's check if Tiger can jump over it
                landing = self.get_jump_target(self.tiger_pos, neighbor)
                if landing is not None:
                    # Landing point must be empty and not the Tiger's current location (which is occupied)
                    if landing not in self.goats and landing != self.tiger_pos:
                        jump_moves.append({
                            'goat_pos': neighbor,
                            'landing_pos': landing
                        })
                        
        return simple_moves, jump_moves

    def get_goat_actions(self, goat_idx):
        """
        Calculates all adjacent vacant moves for a single selected Goat.
        """
        valid_steps = []
        if goat_idx not in self.goats:
            return valid_steps
            
        for neighbor in ADJACENCY[goat_idx]:
            if neighbor not in self.goats and neighbor != self.tiger_pos:
                valid_steps.append(neighbor)
        return valid_steps

    def check_victory_states(self):
        """
        Checks if the Tiger is trapped (Goats Win) or if goats are reduced to < 4 (Tiger Wins).
        """
        # 1. Tiger Win Check
        if len(self.goats) < 4:
            self.game_over = True
            self.winner = "TIGER"
            return

        # 2. Goats Win Check: check if Tiger has 0 legal steps and 0 jump-captures
        simple, jumps = self.get_tiger_actions()
        if len(simple) == 0 and len(jumps) == 0:
            self.game_over = True
            self.winner = "GOATS"

    def handle_click(self, mouse_pos):
        """
        Processes mouse clicks on the board points.
        """
        if self.game_over:
            return

        # Find which of the 19 nodes was clicked
        clicked_idx = None
        for idx in POINTS_NORM.keys():
            screen_pos = get_screen_pos(idx)
            dist = math.hypot(mouse_pos[0] - screen_pos[0], mouse_pos[1] - screen_pos[1])
            if dist <= CLICK_RADIUS:
                clicked_idx = idx
                break

        if clicked_idx is None:
            # Clicked outside any active point nodes, deselect
            self.selected_point = None
            return

        # --- Turn Management ---
        if self.turn == "TIGER":
            # Tiger must select itself
            if clicked_idx == self.tiger_pos:
                self.selected_point = clicked_idx
            elif self.selected_point == self.tiger_pos:
                # Process move or capture
                simple, jumps = self.get_tiger_actions()
                
                # Check normal move
                if clicked_idx in simple:
                    self.move_history.append(f"Tiger: {self.tiger_pos} -> {clicked_idx}")
                    self.tiger_pos = clicked_idx
                    self.selected_point = None
                    self.turn = "GOAT"
                    self.check_victory_states()
                    
                # Check jump capture
                else:
                    for jump in jumps:
                        if clicked_idx == jump['landing_pos']:
                            # Execute capture!
                            eaten_goat = jump['goat_pos']
                            self.goats.remove(eaten_goat)
                            self.move_history.append(f"Tiger ate Goat at {eaten_goat}! Jumps {self.tiger_pos} -> {clicked_idx}")
                            self.tiger_pos = clicked_idx
                            self.selected_point = None
                            self.turn = "GOAT"
                            self.check_victory_states()
                            break
                    else:
                        # Invalid target, deselect or re-select tiger
                        self.selected_point = None

        elif self.turn == "GOAT":
            # Select a Goat
            if clicked_idx in self.goats:
                self.selected_point = clicked_idx
            elif self.selected_point is not None and self.selected_point in self.goats:
                # Attempt to move the selected Goat
                legal_steps = self.get_goat_actions(self.selected_point)
                if clicked_idx in legal_steps:
                    # Move Goat
                    self.goats.remove(self.selected_point)
                    self.goats.add(clicked_idx)
                    self.move_history.append(f"Goat: {self.selected_point} -> {clicked_idx}")
                    self.selected_point = None
                    self.turn = "TIGER"
                    self.check_victory_states()
                else:
                    # Clicked an invalid node, selection reset or changed to another clicked goat
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
        """
        Renders the beautiful Hourglass board layout on the screen.
        """
        # Outer Wooden Frame Accent (The Damru Border)
        # Symmetrical top-half points mapped as a polygon outline
        top_polygon = [
            get_screen_pos(0), get_screen_pos(3),
            get_screen_pos(8), get_screen_pos(9),
            get_screen_pos(7)
        ]
        # Bottom-half polygon outline
        bottom_polygon = [
            get_screen_pos(9), get_screen_pos(11),
            get_screen_pos(18), get_screen_pos(15),
            get_screen_pos(10)
        ]

        # Draw Wood Borders
        pygame.draw.polygon(screen, (220, 210, 190), top_polygon, 0)
        pygame.draw.polygon(screen, (220, 210, 190), bottom_polygon, 0)
        
        # 1. Draw All Line Connections (Lines between nodes)
        for line in UNIQUE_LINES:
            start_p = get_screen_pos(line[0])
            end_p = get_screen_pos(line[1])
            # Thick brown board connections
            pygame.draw.line(screen, COLOR_LINE, start_p, end_p, 4)

        # 2. Draw ALL 19 Intersection Points
        for idx in POINTS_NORM.keys():
            pos = get_screen_pos(idx)
            # Outer ring
            pygame.draw.circle(screen, COLOR_LINE, pos, 8)
            # Inner core
            pygame.draw.circle(screen, COLOR_VERTEX, pos, 5)

        # 3. Draw Highlights for Selected Piece & Available Steps
        if not self.game_over and self.selected_point is not None:
            # Selected piece ring glow
            sel_pos = get_screen_pos(self.selected_point)
            pygame.draw.circle(screen, COLOR_SELECT, sel_pos, PIECE_RADIUS + 5, 3)
            
            # Show targets
            if self.turn == "TIGER" and self.selected_point == self.tiger_pos:
                simple, jumps = self.get_tiger_actions()
                for target in simple:
                    t_pos = get_screen_pos(target)
                    pygame.draw.circle(screen, COLOR_HOVER, t_pos, 10, 3)
                    pygame.draw.circle(screen, COLOR_HOVER, t_pos, 4)
                for jump in jumps:
                    t_pos = get_screen_pos(jump['landing_pos'])
                    pygame.draw.circle(screen, COLOR_ALERT, t_pos, 12, 3)
                    pygame.draw.circle(screen, COLOR_ALERT, t_pos, 5)
                    
            elif self.turn == "GOAT" and self.selected_point in self.goats:
                legal_targets = self.get_goat_actions(self.selected_point)
                for target in legal_targets:
                    t_pos = get_screen_pos(target)
                    pygame.draw.circle(screen, COLOR_HOVER, t_pos, 10, 3)
                    pygame.draw.circle(screen, COLOR_HOVER, t_pos, 4)

        # 4. Draw Hover node hint
        if hover_pt is not None:
            h_pos = get_screen_pos(hover_pt)
            pygame.draw.circle(screen, COLOR_HOVER, h_pos, PIECE_RADIUS + 2, 2)

        # 5. Draw the Goats (Ivory stones)
        for goat_idx in self.goats:
            g_pos = get_screen_pos(goat_idx)
            # Piece Shadow
            pygame.draw.circle(screen, (180, 180, 185), (g_pos[0] + 2, g_pos[1] + 2), PIECE_RADIUS)
            # Main Ivory Body
            pygame.draw.circle(screen, COLOR_GOAT, g_pos, PIECE_RADIUS)
            # Subtle Border Gray Rim
            pygame.draw.circle(screen, COLOR_GOAT_BORDER, g_pos, PIECE_RADIUS, 2)
            # Inner accent decoration
            pygame.draw.circle(screen, (220, 220, 225), g_pos, PIECE_RADIUS - 6, 1)

        # 6. Draw the Tiger (Crimson tiger shield)
        t_pos = get_screen_pos(self.tiger_pos)
        # Shadow
        pygame.draw.circle(screen, COLOR_TIGER_SHADOW, (t_pos[0] + 3, t_pos[1] + 3), PIECE_RADIUS + 1)
        # Crimson circle
        pygame.draw.circle(screen, COLOR_TIGER, t_pos, PIECE_RADIUS + 1)
        # Inner Gold Ring
        pygame.draw.circle(screen, COLOR_SELECT, t_pos, PIECE_RADIUS - 4, 2)
        # Core Eye / Dot
        pygame.draw.circle(screen, COLOR_TIGER_SHADOW, t_pos, 6)

    def draw_hud(self):
        """
        Renders HUD panels, headers, rules summaries, and activity logs.
        """
        # Screen Title
        title_surf = self.font_title.render("SHER AUR BAKRI (TIGER & GOATS)", True, COLOR_TEXT_MAIN)
        title_rect = title_surf.get_rect(center=(WIDTH // 2, 45))
        screen.blit(title_surf, title_rect)

        # Board outline wood frame (Symmetrical central line)
        pygame.draw.rect(screen, COLOR_WOOD_DARK, (50, 100, WIDTH - 100, HEIGHT - 220), 4)

        # Turn indicator box (Bottom)
        status_y = HEIGHT - 95
        pygame.draw.rect(screen, (230, 225, 215), (50, status_y, WIDTH - 100, 65), 0)
        pygame.draw.rect(screen, COLOR_WOOD_DARK, (50, status_y, WIDTH - 100, 65), 2)

        # Text strings
        turn_text = f"CURRENT TURN: {self.turn}"
        goats_left = f"ACTIVE GOATS: {len(self.goats)} / 7"
        goats_eaten = f"TIGER EATEN: {7 - len(self.goats)}"

        # Status text colors
        turn_color = COLOR_TIGER if self.turn == "TIGER" else COLOR_WOOD_DARK

        txt_turn = self.font_status.render(turn_text, True, turn_color)
        txt_goats = self.font_status.render(goats_left, True, COLOR_TEXT_MAIN)
        txt_eaten = self.font_status.render(goats_eaten, True, COLOR_ALERT)

        screen.blit(txt_turn, (80, status_y + 20))
        screen.blit(txt_goats, (WIDTH - 420, status_y + 20))
        screen.blit(txt_eaten, (WIDTH - 210, status_y + 20))

        # Render recent moves log in mini panels
        log_headline = self.font_status.render("GAME NEWS:", True, COLOR_LINE)
        screen.blit(log_headline, (50, HEIGHT - 118))
        if len(self.move_history) > 0:
            recent_log = self.move_history[-1]
            txt_log = self.font_log.render(recent_log, True, COLOR_TEXT_MAIN)
            screen.blit(txt_log, (190, HEIGHT - 115))

    def draw_winner_overlay(self):
        """
        Semi-transparent screen overlay on game end.
        """
        # Solid dark overlay
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((20, 15, 10, 200)) # alphablended brownish black
        screen.blit(overlay, (0, 0))

        # Visual Dialogue box
        dialog_rect = pygame.Rect(150, HEIGHT // 2 - 150, WIDTH - 300, 300)
        pygame.draw.rect(screen, COLOR_BG, dialog_rect, 0)
        pygame.draw.rect(screen, COLOR_WOOD_DARK, dialog_rect, 8)

        # Render winner announce
        if self.winner == "TIGER":
            ann_text = "TIGER (SHER) WINS!"
            sub_text = "The Tiger ate enough goats to escape captivity."
            ann_color = COLOR_ALERT
        else:
            ann_text = "GOATS (BAKRI) WIN!"
            sub_text = "The Goats surrounded and trapped the Tiger!"
            ann_color = (40, 150, 60)

        txt_winner = self.font_over.render(ann_text, True, ann_color)
        txt_winner_rect = txt_winner.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 60))
        screen.blit(txt_winner, txt_winner_rect)

        txt_sub = self.font_status.render(sub_text, True, COLOR_TEXT_MAIN)
        txt_sub_rect = txt_sub.get_rect(center=(WIDTH // 2, HEIGHT // 2))
        screen.blit(txt_sub, txt_sub_rect)

        # Restart call to action button outline
        btn_rect = pygame.Rect(WIDTH // 2 - 140, HEIGHT // 2 + 50, 280, 50)
        pygame.draw.rect(screen, COLOR_WOOD_DARK, btn_rect, 0)
        txt_btn = self.font_button.render("PRESS 'R' KEY TO REMATCH", True, COLOR_BG)
        txt_btn_rect = txt_btn.get_rect(center=btn_rect.center)
        screen.blit(txt_btn, txt_btn_rect)

    def run_game_loop(self):
        running = True
        while running:
            # Detect Hover to make selection clean
            hover_pt = None
            mouse_pos = pygame.mouse.get_pos()
            for idx in POINTS_NORM.keys():
                screen_pos = get_screen_pos(idx)
                dist = math.hypot(mouse_pos[0] - screen_pos[0], mouse_pos[1] - screen_pos[1])
                if dist <= CLICK_RADIUS:
                    hover_pt = idx
                    break

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                    
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1: # Left Click
                        self.handle_click(event.pos)
                        
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_r:
                        self.reset_game()

            # Drawing
            screen.fill((54, 42, 34)) # Mahogany room background fill
            
            # Draw board arena container
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
