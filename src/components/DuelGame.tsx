"use client";

import { useState } from "react";
import { runBotTurn } from "@/lib/ai";
import { ALL_DEFS } from "@/lib/cards";
import {
  createGame,
  declareAttack,
  endTurn,
  goToBattle,
  playSpell,
  summonMonster,
  type GameState,
  type SpellTarget,
} from "@/lib/engine";
import { FieldSlot, HandCard } from "./CardView";

type PendingSpell = {
  handIndex: number;
  needsTarget: boolean;
  side: "own" | "opponent" | null;
};

const SPELL_TARGET_SIDE: Record<string, "own" | "opponent" | null> = {
  power_surge: "own",
  mirror_shield: "own",
  sabotage: "opponent",
  arcane_blast: "opponent",
  healing_light: null,
  quick_draw: null,
};

export default function DuelGame() {
  const [game, setGame] = useState<GameState | null>(null);
  const [passDevice, setPassDevice] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [pendingSpell, setPendingSpell] = useState<PendingSpell | null>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<number | null>(null);
  const [selectedHandMonster, setSelectedHandMonster] = useState<number | null>(null);

  function startGame(mode: "pvp" | "pvbot") {
    setGame(createGame(mode));
    setPassDevice(false);
    setBotThinking(false);
    setPendingSpell(null);
    setSelectedAttacker(null);
    setSelectedHandMonster(null);
  }

  function afterAction(next: GameState) {
    setGame(next);
    if (next.phase === "gameover") return;
  }

  function handleEndTurn() {
    if (!game) return;
    const next = endTurn(game);
    setSelectedAttacker(null);
    setSelectedHandMonster(null);
    setPendingSpell(null);

    if (next.phase === "gameover") {
      setGame(next);
      return;
    }

    if (next.mode === "pvbot" && next.activePlayer === 1) {
      setGame(next);
      setBotThinking(true);
      setTimeout(() => {
        const afterBot = runBotTurn(next);
        setGame(afterBot);
        setBotThinking(false);
      }, 700);
    } else {
      setGame(next);
      setPassDevice(true);
    }
  }

  function handleHandCardClick(index: number) {
    if (!game || game.phase !== "main") return;
    const p = game.players[game.activePlayer];
    const card = p.hand[index];
    const def = ALL_DEFS[card.defId];

    if (def.type === "monster") {
      setPendingSpell(null);
      setSelectedHandMonster((prev) => (prev === index ? null : index));
      return;
    }

    setSelectedHandMonster(null);
    const side = SPELL_TARGET_SIDE[def.effect!];
    if (side === null) {
      const next = playSpell(game, game.activePlayer, index, null);
      afterAction(next);
      setPendingSpell(null);
    } else {
      setPendingSpell({ handIndex: index, needsTarget: true, side });
    }
  }

  function summon(position: "attack" | "defense") {
    if (!game || selectedHandMonster === null) return;
    const next = summonMonster(game, game.activePlayer, selectedHandMonster, position);
    afterAction(next);
    setSelectedHandMonster(null);
  }

  function handleFieldClick(ownerIdx: 0 | 1, fieldIndex: number) {
    if (!game) return;
    const active = game.activePlayer;
    const opponentIdx: 0 | 1 = active === 0 ? 1 : 0;

    if (pendingSpell) {
      const requiredIdx = pendingSpell.side === "own" ? active : opponentIdx;
      if (ownerIdx !== requiredIdx) return;
      const monster = game.players[ownerIdx].field[fieldIndex];
      if (!monster) return;
      const target: SpellTarget = { playerIdx: ownerIdx, fieldIndex };
      const next = playSpell(game, active, pendingSpell.handIndex, target);
      afterAction(next);
      setPendingSpell(null);
      return;
    }

    if (game.phase !== "battle") return;

    if (ownerIdx === active) {
      const monster = game.players[active].field[fieldIndex];
      if (!monster || monster.position !== "attack" || monster.hasAttacked || monster.summonedThisTurn) return;
      setSelectedAttacker((prev) => (prev === fieldIndex ? null : fieldIndex));
      return;
    }

    if (ownerIdx === opponentIdx && selectedAttacker !== null) {
      const target = game.players[opponentIdx].field[fieldIndex];
      if (!target) return;
      const next = declareAttack(game, active, selectedAttacker, fieldIndex);
      afterAction(next);
      setSelectedAttacker(null);
    }
  }

  function directAttack() {
    if (!game || selectedAttacker === null) return;
    const next = declareAttack(game, game.activePlayer, selectedAttacker, null);
    afterAction(next);
    setSelectedAttacker(null);
  }

  if (!game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 p-6 text-center text-white">
        <h1 className="text-3xl font-bold">Duel Arena</h1>
        <p className="max-w-xs text-sm text-zinc-400">
          เกมการ์ดต่อสู้ 1 ต่อ 1 ผลัดกันซัมมอนมอนสเตอร์และโจมตี ใครทำ Life Points ของอีกฝ่ายหมดก่อนชนะ
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => startGame("pvp")}
            className="rounded-lg bg-white px-6 py-3 font-semibold text-zinc-900"
          >
            เล่น 2 คน (ผลัดเครื่อง)
          </button>
          <button
            onClick={() => startGame("pvbot")}
            className="rounded-lg border border-white px-6 py-3 font-semibold text-white"
          >
            เล่นกับบอท
          </button>
        </div>
      </div>
    );
  }

  if (game.phase === "gameover") {
    const winnerName = game.winner !== null ? game.players[game.winner].name : "-";
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 p-6 text-center text-white">
        <h1 className="text-3xl font-bold">🏆 {winnerName} ชนะ!</h1>
        <button onClick={() => setGame(null)} className="rounded-lg bg-white px-6 py-3 font-semibold text-zinc-900">
          เล่นใหม่
        </button>
      </div>
    );
  }

  if (passDevice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 p-6 text-center text-white">
        <h1 className="text-2xl font-bold">ส่งเครื่องให้ {game.players[game.activePlayer].name}</h1>
        <p className="text-sm text-zinc-400">แตะเมื่อพร้อมเล่นเทิร์นถัดไป</p>
        <button
          onClick={() => setPassDevice(false)}
          className="rounded-lg bg-white px-8 py-3 font-semibold text-zinc-900"
        >
          พร้อมแล้ว
        </button>
      </div>
    );
  }

  const active = game.activePlayer;
  const opponentIdx: 0 | 1 = active === 0 ? 1 : 0;
  const you = game.players[active];
  const opp = game.players[opponentIdx];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 p-3 text-white">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>
          {opp.name} — LP {Math.max(0, opp.lp)}
        </span>
        <span className="text-zinc-400">
          เทิร์น {game.turn} · {game.phase === "main" ? "หลัก" : "ต่อสู้"}
        </span>
        <span>
          {you.name} — LP {Math.max(0, you.lp)}
        </span>
      </div>

      <div className="mb-2 flex justify-center gap-2">
        {opp.field.map((m, i) => (
          <FieldSlot
            key={i}
            monster={m}
            highlight={pendingSpell?.side === "opponent" && m ? "spell-target" : selectedAttacker !== null && m ? "target" : null}
            onClick={() => handleFieldClick(opponentIdx, i)}
          />
        ))}
      </div>

      <div className="my-3 h-16 overflow-y-auto rounded bg-zinc-900/60 p-2 text-[11px] text-zinc-400">
        {game.log.slice(-6).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        {botThinking && <div className="text-yellow-400">บอทกำลังคิด...</div>}
      </div>

      <div className="mb-2 flex justify-center gap-2">
        {you.field.map((m, i) => (
          <FieldSlot
            key={i}
            monster={m}
            highlight={
              pendingSpell?.side === "own" && m
                ? "spell-target"
                : selectedAttacker === i
                  ? "attacker"
                  : null
            }
            onClick={() => handleFieldClick(active, i)}
          />
        ))}
      </div>

      {selectedHandMonster !== null && (
        <div className="mb-2 flex justify-center gap-2 text-sm">
          <button onClick={() => summon("attack")} className="rounded bg-orange-600 px-3 py-1">
            ซัมมอน (โจมตี)
          </button>
          <button onClick={() => summon("defense")} className="rounded bg-blue-700 px-3 py-1">
            ซัมมอน (ป้องกัน)
          </button>
          <button onClick={() => setSelectedHandMonster(null)} className="rounded bg-zinc-700 px-3 py-1">
            ยกเลิก
          </button>
        </div>
      )}

      {pendingSpell && (
        <div className="mb-2 text-center text-xs text-yellow-300">
          เลือกเป้าหมาย{pendingSpell.side === "own" ? "การ์ดฝั่งคุณ" : "การ์ดฝั่งคู่แข่ง"} หรือ{" "}
          <button className="underline" onClick={() => setPendingSpell(null)}>
            ยกเลิก
          </button>
        </div>
      )}

      {game.phase === "battle" && selectedAttacker !== null && opp.field.every((m) => m === null) && (
        <div className="mb-2 flex justify-center">
          <button onClick={directAttack} className="rounded bg-red-600 px-4 py-1 text-sm font-semibold">
            โจมตีตรง
          </button>
        </div>
      )}

      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        {you.hand.map((c, i) => (
          <HandCard
            key={c.instanceId}
            defId={c.defId}
            selected={selectedHandMonster === i || pendingSpell?.handIndex === i}
            onClick={() => handleHandCardClick(i)}
          />
        ))}
      </div>

      <div className="mt-auto flex justify-center gap-3">
        {game.phase === "main" && (
          <button
            onClick={() => afterAction(goToBattle(game, active))}
            className="rounded-lg bg-white px-5 py-2 font-semibold text-zinc-900"
          >
            ไปสู่การต่อสู้
          </button>
        )}
        <button onClick={handleEndTurn} className="rounded-lg border border-white px-5 py-2 font-semibold">
          จบเทิร์น
        </button>
      </div>
    </div>
  );
}
