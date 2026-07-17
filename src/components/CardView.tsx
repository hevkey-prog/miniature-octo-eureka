import { ALL_DEFS } from "@/lib/cards";
import type { FieldMonster } from "@/lib/engine";

const TYPE_COLOR: Record<string, string> = {
  monster: "from-orange-500 to-red-600",
  spell: "from-emerald-500 to-teal-600",
};

export function HandCard({
  defId,
  selected,
  onClick,
}: {
  defId: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const def = ALL_DEFS[defId];
  return (
    <button
      onClick={onClick}
      className={`flex w-24 shrink-0 flex-col rounded-lg bg-gradient-to-b ${TYPE_COLOR[def.type]} p-2 text-left text-white shadow transition-transform ${
        selected ? "-translate-y-2 ring-2 ring-yellow-300" : ""
      }`}
    >
      <div className="text-[11px] font-bold leading-tight">{def.name}</div>
      <div className="mt-1 line-clamp-3 text-[9px] opacity-90">{def.description}</div>
      {def.type === "monster" && (
        <div className="mt-1 flex justify-between text-[10px] font-semibold">
          <span>ATK {def.atk}</span>
          <span>DEF {def.def}</span>
        </div>
      )}
    </button>
  );
}

export function FieldSlot({
  monster,
  highlight,
  onClick,
}: {
  monster: FieldMonster | null;
  highlight?: "attacker" | "target" | "spell-target" | null;
  onClick?: () => void;
}) {
  const ring =
    highlight === "attacker"
      ? "ring-4 ring-yellow-400"
      : highlight === "target" || highlight === "spell-target"
        ? "ring-4 ring-red-400"
        : "";
  if (!monster) {
    return (
      <button
        onClick={onClick}
        className="flex h-20 w-16 items-center justify-center rounded-md border border-dashed border-zinc-400/50 text-[10px] text-zinc-400"
      >
        ว่าง
      </button>
    );
  }
  const def = ALL_DEFS[monster.defId];
  const atk = Math.max(0, def.atk! + monster.atkMod);
  const dfs = Math.max(0, def.def! + monster.defMod);
  return (
    <button
      onClick={onClick}
      className={`flex h-20 w-16 flex-col justify-between rounded-md bg-gradient-to-b from-orange-500 to-red-700 p-1 text-white shadow ${ring} ${
        monster.position === "defense" ? "opacity-80" : ""
      }`}
    >
      <div className="text-[9px] font-bold leading-tight">{def.name}</div>
      <div className="text-[8px]">{monster.position === "attack" ? "⚔ ATK" : "🛡 DEF"}</div>
      <div className="text-[9px] font-semibold">{monster.position === "attack" ? atk : dfs}</div>
    </button>
  );
}
