import React from "react";
import { Shield, Target, Trophy, HelpCircle, CornerDownRight, HelpCircle as HelpIcon } from "lucide-react";

export default function RulesPanel() {
  return (
    <div id="rules_panel" className="bg-stone-50 border border-stone-200 rounded-2xl p-6 shadow-sm overflow-y-auto max-h-[600px]">
      <div className="flex items-center gap-3 border-b border-stone-200 pb-4 mb-5">
        <HelpCircle className="w-6 h-6 text-amber-700" id="rules_icon" />
        <h2 className="text-xl font-bold font-sans text-stone-800 tracking-tight">How to Play: Tiger & Goats</h2>
      </div>

      <div className="space-y-6 text-sm text-stone-600 leading-relaxed">
        {/* Concept */}
        <div>
          <h3 className="text-stone-800 font-semibold mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600" />
            1. Symmetrical Dual Arena
          </h3>
          <p>
            <strong>Sher aur Bakri</strong> is a classic traditional board game played on a 19-point Hourglass (Damru) shaped grid.
            The board consists of two symmetrical triangular camps representing the Tiger's peaks and the Goats' plains, meeting at a single central crossing point.
          </p>
        </div>

        {/* Roles and Movement */}
        <div>
          <h3 className="text-stone-800 font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            2. Piece Mechanics & Setup
          </h3>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong>The Tiger (Sher)</strong>: Starts at the very top-left corner node. Moves first. The tiger seeks to hunt down and eat the goats.
            </li>
            <li>
              <strong>7 Goats (Bakri)</strong>: Start fully placed on the bottom triangular base nodes. Slower but act in unison to corner the beast.
            </li>
          </ul>
        </div>

        {/* Movement and Jumps */}
        <div>
          <h3 className="text-stone-800 font-semibold mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-red-600" />
            3. Legal Movements and Eating
          </h3>
          <div className="space-y-2 pl-4 border-l-2 border-stone-200">
            <p>
              <strong>Simple Steps:</strong> On their turn, any piece can step exactly 1 node along any connecting black line to a direct, empty neighbor node.
            </p>
            <p id="eating_desc">
              <strong>Tiger Hunting (Capturing Goats):</strong> If the Tiger is next to a Goat and the vertex directly behind that Goat in a straight collinear line is empty, the Tiger can <strong>jump over the Goat</strong> to land on that empty spot. The jumped Goat is eaten and removed from play.
            </p>
            <p className="bg-amber-100/50 text-amber-900 border border-amber-200/60 rounded-lg p-3 text-xs">
              <strong>Chain Defense Rule (Crucial):</strong> If two Goats are lined up next to each other in front of the Tiger (Tiger → Goat 1 → Goat 2), the Tiger <strong>CANNOT</strong> jump or capture Goat 1. Goat 2 protects Goat 1 because the space directly behind Goat 1 is occupied!
            </p>
          </div>
        </div>

        {/* Victory Conditions */}
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-4">
          <h3 className="text-stone-800 font-semibold mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
            Game Over Conditions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-3 rounded-lg border border-stone-200">
              <span className="font-bold text-emerald-700 block mb-1">🐐 Goats Victory</span>
              If the Goats completely surround, barricade, and trap the Tiger so that it has 0 legal steps or jumps remaining!
            </div>
            <div className="bg-white p-3 rounded-lg border border-stone-200">
              <span className="font-bold text-red-700 block mb-1">🐅 Tiger Victory</span>
              If the Tiger eats enough Goats so that the remaining Goats count falls <strong>below 4</strong>, making them physically unable to trap the Tiger.
            </div>
          </div>
        </div>

        {/* Strategic Tips */}
        <div className="border-t border-stone-200 pt-4 text-xs">
          <span className="font-semibold text-stone-800 block mb-1">💡 Pro Tips</span>
          <p className="italic">
            <strong>As Goats:</strong> Stay huddled together! Keep your goats in diagonal rows or horizontal lines so they shield each other. Do not let the Tiger penetrate your chain.
          </p>
          <p className="italic mt-1">
            <strong>As Tiger:</strong> Use the central bottleneck (Node 9) to slice through Goat arrays. Force the Goats to disperse so you can pick them off individually.
          </p>
        </div>
      </div>
    </div>
  );
}
