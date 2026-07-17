import { ALL_DEFS } from "./cards";
import {
  declareAttack,
  endTurn,
  goToBattle,
  playSpell,
  summonMonster,
  type GameState,
} from "./engine";

const BOT = 1 as const;
const HUMAN = 0 as const;

function effectiveAtk(atk: number, mod: number) {
  return Math.max(0, atk + mod);
}
function effectiveDef(def: number, mod: number) {
  return Math.max(0, def + mod);
}

/** Runs the bot's entire turn (main phase decisions, battle, end turn) and returns the resulting state. */
export function runBotTurn(initialState: GameState): GameState {
  let state = initialState;
  if (state.mode !== "pvbot" || state.activePlayer !== BOT || state.phase !== "main") {
    return state;
  }

  const bot = () => state.players[BOT];
  const human = () => state.players[HUMAN];

  // 1. Play Arcane Blast on any killable human monster.
  for (;;) {
    const idx = bot().hand.findIndex((c) => ALL_DEFS[c.defId].effect === "arcane_blast");
    if (idx === -1) break;
    const targetIdx = human().field.findIndex(
      (m) => m && effectiveAtk(ALL_DEFS[m.defId].atk!, m.atkMod) <= 1500
    );
    if (targetIdx === -1) break;
    const nextState = playSpell(state, BOT, idx, { playerIdx: HUMAN, fieldIndex: targetIdx });
    if (nextState === state) break;
    state = nextState;
  }

  // 2. Heal if low on life.
  {
    const idx = bot().hand.findIndex((c) => ALL_DEFS[c.defId].effect === "healing_light");
    if (idx !== -1 && bot().lp <= 4000) {
      state = playSpell(state, BOT, idx, null);
    }
  }

  // 3. Draw more cards, always good value.
  for (;;) {
    const idx = bot().hand.findIndex((c) => ALL_DEFS[c.defId].effect === "quick_draw");
    if (idx === -1) break;
    const nextState = playSpell(state, BOT, idx, null);
    if (nextState === state) break;
    state = nextState;
  }

  // 4. Summon the strongest available monster, if not done yet.
  if (!bot().hasSummonedThisTurn) {
    const monsterIdxs = bot()
      .hand.map((c, i) => ({ c, i }))
      .filter(({ c }) => ALL_DEFS[c.defId].type === "monster");
    if (monsterIdxs.length > 0) {
      monsterIdxs.sort((a, b) => (ALL_DEFS[b.c.defId].atk ?? 0) - (ALL_DEFS[a.c.defId].atk ?? 0));
      const best = monsterIdxs[0];
      const humanBestAtk = Math.max(
        0,
        ...human().field.filter((m): m is NonNullable<typeof m> => m !== null).map((m) => effectiveAtk(ALL_DEFS[m.defId].atk!, m.atkMod))
      );
      const myAtk = ALL_DEFS[best.c.defId].atk ?? 0;
      const position = myAtk >= humanBestAtk ? "attack" : "defense";
      state = summonMonster(state, BOT, best.i, position);
    }
  }

  // 5. Sabotage the human's strongest monster if one remains threatening.
  {
    const idx = bot().hand.findIndex((c) => ALL_DEFS[c.defId].effect === "sabotage");
    if (idx !== -1) {
      const field = human().field;
      let bestTarget = -1;
      let bestAtk = -1;
      field.forEach((m, i) => {
        if (m) {
          const a = effectiveAtk(ALL_DEFS[m.defId].atk!, m.atkMod);
          if (a > bestAtk) {
            bestAtk = a;
            bestTarget = i;
          }
        }
      });
      if (bestTarget !== -1) {
        state = playSpell(state, BOT, idx, { playerIdx: HUMAN, fieldIndex: bestTarget });
      }
    }
  }

  // 6. Power Surge on the strongest own attacker before battle.
  {
    const idx = bot().hand.findIndex((c) => ALL_DEFS[c.defId].effect === "power_surge");
    if (idx !== -1) {
      const field = bot().field;
      let bestTarget = -1;
      let bestAtk = -1;
      field.forEach((m, i) => {
        if (m && m.position === "attack" && !m.summonedThisTurn) {
          const a = effectiveAtk(ALL_DEFS[m.defId].atk!, m.atkMod);
          if (a > bestAtk) {
            bestAtk = a;
            bestTarget = i;
          }
        }
      });
      if (bestTarget !== -1) {
        state = playSpell(state, BOT, idx, { playerIdx: BOT, fieldIndex: bestTarget });
      }
    }
  }

  // 7. Move to battle and attack with anything favorable.
  state = goToBattle(state, BOT);
  if (state.phase === "battle") {
    bot().field.forEach((attacker, attackerIdx) => {
      if (!attacker || attacker.position !== "attack" || attacker.hasAttacked || attacker.summonedThisTurn) {
        return;
      }
      const attackerAtk = effectiveAtk(ALL_DEFS[attacker.defId].atk!, attacker.atkMod);
      const opponentField = human().field;
      const hasOpponentMonsters = opponentField.some((m) => m !== null);

      if (!hasOpponentMonsters) {
        state = declareAttack(state, BOT, attackerIdx, null);
        return;
      }

      let bestTarget = -1;
      let bestScore = -Infinity;
      opponentField.forEach((m, i) => {
        if (!m) return;
        const stat = m.position === "attack" ? effectiveAtk(ALL_DEFS[m.defId].atk!, m.atkMod) : effectiveDef(ALL_DEFS[m.defId].def!, m.defMod);
        if (attackerAtk >= stat) {
          const score = stat;
          if (score > bestScore) {
            bestScore = score;
            bestTarget = i;
          }
        }
      });

      if (bestTarget !== -1) {
        state = declareAttack(state, BOT, attackerIdx, bestTarget);
      }
    });
  }

  state = endTurn(state);
  return state;
}
