import { ALL_DEFS, buildDeckList } from "./cards";

export type CardInstance = {
  instanceId: string;
  defId: string;
};

export type FieldMonster = {
  instanceId: string;
  defId: string;
  position: "attack" | "defense";
  atkMod: number;
  defMod: number;
  hasAttacked: boolean;
  summonedThisTurn: boolean;
};

export type PlayerState = {
  name: string;
  lp: number;
  deck: CardInstance[];
  hand: CardInstance[];
  field: (FieldMonster | null)[];
  graveyard: CardInstance[];
  hasSummonedThisTurn: boolean;
};

export type Phase = "main" | "battle" | "end" | "gameover";

export type GameState = {
  players: [PlayerState, PlayerState];
  activePlayer: 0 | 1;
  turn: number;
  phase: Phase;
  mode: "pvp" | "pvbot";
  winner: 0 | 1 | null;
  log: string[];
};

const FIELD_SIZE = 3;
let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `c${idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function freshPlayer(name: string): PlayerState {
  const deck: CardInstance[] = shuffle(buildDeckList()).map((defId) => ({
    instanceId: nextId(),
    defId,
  }));
  const hand = deck.splice(0, 5);
  return {
    name,
    lp: 8000,
    deck,
    hand,
    field: Array(FIELD_SIZE).fill(null),
    graveyard: [],
    hasSummonedThisTurn: false,
  };
}

export function createGame(mode: "pvp" | "pvbot"): GameState {
  return {
    players: [freshPlayer("Player 1"), freshPlayer(mode === "pvbot" ? "Bot" : "Player 2")],
    activePlayer: 0,
    turn: 1,
    phase: "main",
    mode,
    winner: null,
    log: ["เกมเริ่มต้น! Player 1 เริ่มก่อน"],
  };
}

function clone(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function pushLog(state: GameState, msg: string) {
  state.log.push(msg);
  if (state.log.length > 50) state.log.shift();
}

function checkWinner(state: GameState) {
  if (state.players[0].lp <= 0) {
    state.winner = 1;
    state.phase = "gameover";
  } else if (state.players[1].lp <= 0) {
    state.winner = 0;
    state.phase = "gameover";
  }
}

export function drawCard(state: GameState, playerIdx: 0 | 1): GameState {
  const next = clone(state);
  const player = next.players[playerIdx];
  const card = player.deck.shift();
  if (!card) {
    next.winner = playerIdx === 0 ? 1 : 0;
    next.phase = "gameover";
    pushLog(next, `${player.name} การ์ดในสำรับหมด! แพ้ทันที`);
    return next;
  }
  player.hand.push(card);
  pushLog(next, `${player.name} จั่วการ์ด`);
  return next;
}

export function summonMonster(
  state: GameState,
  playerIdx: 0 | 1,
  handIndex: number,
  position: "attack" | "defense"
): GameState {
  const next = clone(state);
  const player = next.players[playerIdx];
  if (next.phase !== "main" || next.activePlayer !== playerIdx) return state;
  if (player.hasSummonedThisTurn) return state;
  const card = player.hand[handIndex];
  if (!card) return state;
  const def = ALL_DEFS[card.defId];
  if (def.type !== "monster") return state;
  const slot = player.field.findIndex((f) => f === null);
  if (slot === -1) return state;

  player.hand.splice(handIndex, 1);
  player.field[slot] = {
    instanceId: card.instanceId,
    defId: card.defId,
    position,
    atkMod: 0,
    defMod: 0,
    hasAttacked: false,
    summonedThisTurn: true,
  };
  player.hasSummonedThisTurn = true;
  pushLog(next, `${player.name} ซัมมอน ${def.name} (${position === "attack" ? "โจมตี" : "ป้องกัน"})`);
  return next;
}

export type SpellTarget = { playerIdx: 0 | 1; fieldIndex: number } | null;

export function playSpell(
  state: GameState,
  playerIdx: 0 | 1,
  handIndex: number,
  target: SpellTarget
): GameState {
  const next = clone(state);
  if (next.phase !== "main" || next.activePlayer !== playerIdx) return state;
  const player = next.players[playerIdx];
  const opponent = next.players[playerIdx === 0 ? 1 : 0];
  const card = player.hand[handIndex];
  if (!card) return state;
  const def = ALL_DEFS[card.defId];
  if (def.type !== "spell") return state;

  const consume = () => {
    player.hand.splice(handIndex, 1);
    player.graveyard.push(card);
  };

  switch (def.effect) {
    case "healing_light": {
      player.lp += 800;
      consume();
      pushLog(next, `${player.name} ใช้ Healing Light ฟื้นฟู 800 LP`);
      break;
    }
    case "quick_draw": {
      consume();
      pushLog(next, `${player.name} ใช้ Quick Draw จั่ว 2 ใบ`);
      for (let i = 0; i < 2; i++) {
        const drawn = player.deck.shift();
        if (drawn) player.hand.push(drawn);
      }
      break;
    }
    case "power_surge":
    case "mirror_shield": {
      if (!target || target.playerIdx !== playerIdx) return state;
      const monster = player.field[target.fieldIndex];
      if (!monster) return state;
      if (def.effect === "power_surge") monster.atkMod += 600;
      else monster.defMod += 600;
      consume();
      pushLog(next, `${player.name} ใช้ ${def.name} กับ ${ALL_DEFS[monster.defId].name}`);
      break;
    }
    case "sabotage": {
      if (!target || target.playerIdx === playerIdx) return state;
      const monster = opponent.field[target.fieldIndex];
      if (!monster) return state;
      monster.atkMod -= 500;
      consume();
      pushLog(next, `${player.name} ใช้ Sabotage กับ ${ALL_DEFS[monster.defId].name}`);
      break;
    }
    case "arcane_blast": {
      if (!target || target.playerIdx === playerIdx) return state;
      const monster = opponent.field[target.fieldIndex];
      if (!monster) return state;
      const totalAtk = ALL_DEFS[monster.defId].atk! + monster.atkMod;
      if (totalAtk > 1500) return state;
      opponent.graveyard.push({ instanceId: monster.instanceId, defId: monster.defId });
      opponent.field[target.fieldIndex] = null;
      consume();
      pushLog(next, `${player.name} ใช้ Arcane Blast ทำลาย ${ALL_DEFS[monster.defId].name}`);
      break;
    }
    default:
      return state;
  }
  return next;
}

export function goToBattle(state: GameState, playerIdx: 0 | 1): GameState {
  if (state.phase !== "main" || state.activePlayer !== playerIdx) return state;
  const next = clone(state);
  next.phase = "battle";
  return next;
}

function monsterAtk(m: FieldMonster): number {
  return Math.max(0, ALL_DEFS[m.defId].atk! + m.atkMod);
}
function monsterDef(m: FieldMonster): number {
  return Math.max(0, ALL_DEFS[m.defId].def! + m.defMod);
}

export function declareAttack(
  state: GameState,
  playerIdx: 0 | 1,
  attackerFieldIndex: number,
  targetFieldIndex: number | null
): GameState {
  if (state.phase !== "battle" || state.activePlayer !== playerIdx) return state;
  const next = clone(state);
  const player = next.players[playerIdx];
  const opponent = next.players[playerIdx === 0 ? 1 : 0];
  const attacker = player.field[attackerFieldIndex];
  if (!attacker || attacker.position !== "attack" || attacker.hasAttacked || attacker.summonedThisTurn) {
    return state;
  }
  const attackerAtk = monsterAtk(attacker);
  const attackerName = ALL_DEFS[attacker.defId].name;

  const opponentHasMonsters = opponent.field.some((f) => f !== null);

  if (targetFieldIndex === null) {
    if (opponentHasMonsters) return state;
    opponent.lp -= attackerAtk;
    pushLog(next, `${player.name} โจมตีตรง! ${attackerName} สร้างความเสียหาย ${attackerAtk}`);
    attacker.hasAttacked = true;
    checkWinner(next);
    return next;
  }

  const target = opponent.field[targetFieldIndex];
  if (!target) return state;
  attacker.hasAttacked = true;

  if (target.position === "attack") {
    const targetAtk = monsterAtk(target);
    if (attackerAtk > targetAtk) {
      opponent.graveyard.push({ instanceId: target.instanceId, defId: target.defId });
      opponent.field[targetFieldIndex] = null;
      opponent.lp -= attackerAtk - targetAtk;
      pushLog(next, `${attackerName} ทำลาย ${ALL_DEFS[target.defId].name} และสร้างความเสียหาย ${attackerAtk - targetAtk}`);
    } else if (attackerAtk === targetAtk) {
      opponent.graveyard.push({ instanceId: target.instanceId, defId: target.defId });
      opponent.field[targetFieldIndex] = null;
      player.graveyard.push({ instanceId: attacker.instanceId, defId: attacker.defId });
      player.field[attackerFieldIndex] = null;
      pushLog(next, `${attackerName} และ ${ALL_DEFS[target.defId].name} ทำลายกันเอง`);
    } else {
      player.graveyard.push({ instanceId: attacker.instanceId, defId: attacker.defId });
      player.field[attackerFieldIndex] = null;
      player.lp -= targetAtk - attackerAtk;
      pushLog(next, `${attackerName} ถูกทำลายโดย ${ALL_DEFS[target.defId].name} ผู้โจมตีเสียหาย ${targetAtk - attackerAtk}`);
    }
  } else {
    const targetDef = monsterDef(target);
    if (attackerAtk > targetDef) {
      opponent.graveyard.push({ instanceId: target.instanceId, defId: target.defId });
      opponent.field[targetFieldIndex] = null;
      pushLog(next, `${attackerName} ทำลาย ${ALL_DEFS[target.defId].name} (ป้องกัน) ไม่มีความเสียหายเพิ่ม`);
    } else if (attackerAtk < targetDef) {
      player.lp -= targetDef - attackerAtk;
      pushLog(next, `${attackerName} โจมตีการ์ดป้องกันไม่สำเร็จ ผู้โจมตีเสียหาย ${targetDef - attackerAtk}`);
    } else {
      pushLog(next, `${attackerName} โจมตีเสมอกับการ์ดป้องกัน ไม่มีอะไรถูกทำลาย`);
    }
  }

  checkWinner(next);
  return next;
}

export function endTurn(state: GameState): GameState {
  let next = clone(state);
  const currentIdx = next.activePlayer;
  const current = next.players[currentIdx];
  current.field.forEach((m) => {
    if (m) {
      m.hasAttacked = false;
      m.summonedThisTurn = false;
      m.atkMod = 0;
      m.defMod = 0;
    }
  });
  current.hasSummonedThisTurn = false;

  next.activePlayer = currentIdx === 0 ? 1 : 0;
  next.turn += 1;
  next.phase = "main";
  pushLog(next, `--- เทิร์นของ ${next.players[next.activePlayer].name} ---`);

  next = drawCard(next, next.activePlayer);
  return next;
}
