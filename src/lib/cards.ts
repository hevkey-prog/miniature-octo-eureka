export type SpellEffect =
  | "power_surge"
  | "healing_light"
  | "arcane_blast"
  | "quick_draw"
  | "mirror_shield"
  | "sabotage";

export type CardDef = {
  defId: string;
  name: string;
  type: "monster" | "spell";
  atk?: number;
  def?: number;
  effect?: SpellEffect;
  description: string;
};

export const MONSTER_DEFS: CardDef[] = [
  { defId: "m_ember_sprite", name: "Ember Sprite", type: "monster", atk: 1200, def: 800, description: "A small fire spirit, quick to strike." },
  { defId: "m_stone_guardian", name: "Stone Guardian", type: "monster", atk: 800, def: 2000, description: "An ancient sentinel carved from rock." },
  { defId: "m_frost_wyrm", name: "Frost Wyrm", type: "monster", atk: 1800, def: 1200, description: "A serpent of ice and wind." },
  { defId: "m_shadow_prowler", name: "Shadow Prowler", type: "monster", atk: 1600, def: 600, description: "Strikes from the dark before you notice." },
  { defId: "m_storm_falcon", name: "Storm Falcon", type: "monster", atk: 1400, def: 1000, description: "Rides the thunderclouds." },
  { defId: "m_iron_golem", name: "Iron Golem", type: "monster", atk: 1000, def: 2200, description: "Nearly impossible to break through." },
  { defId: "m_flame_serpent", name: "Flame Serpent", type: "monster", atk: 2000, def: 800, description: "Leaves scorched earth in its wake." },
  { defId: "m_aqua_sentinel", name: "Aqua Sentinel", type: "monster", atk: 1300, def: 1500, description: "Guards the deep with balanced fury." },
  { defId: "m_wind_dancer", name: "Wind Dancer", type: "monster", atk: 1100, def: 900, description: "Light on its feet, hard to pin down." },
  { defId: "m_crystal_colossus", name: "Crystal Colossus", type: "monster", atk: 2400, def: 1000, description: "A towering giant of living crystal." },
  { defId: "m_thorn_beast", name: "Thorn Beast", type: "monster", atk: 1500, def: 1300, description: "Covered in razor-sharp brambles." },
  { defId: "m_spark_imp", name: "Spark Imp", type: "monster", atk: 700, def: 500, description: "Small, mischievous, and cheap to summon." },
  { defId: "m_night_owl", name: "Night Owl", type: "monster", atk: 900, def: 1100, description: "Watches silently until it's too late." },
  { defId: "m_sun_paladin", name: "Sun Paladin", type: "monster", atk: 1900, def: 1700, description: "A radiant defender of the light." },
  { defId: "m_void_wraith", name: "Void Wraith", type: "monster", atk: 2100, def: 700, description: "Born from the space between stars." },
  { defId: "m_grove_keeper", name: "Grove Keeper", type: "monster", atk: 1000, def: 1900, description: "Protects the forest with ancient roots." },
];

export const SPELL_DEFS: CardDef[] = [
  { defId: "s_power_surge", name: "Power Surge", type: "spell", effect: "power_surge", description: "Target your monster gains +600 ATK this turn." },
  { defId: "s_healing_light", name: "Healing Light", type: "spell", effect: "healing_light", description: "Restore 800 Life Points." },
  { defId: "s_arcane_blast", name: "Arcane Blast", type: "spell", effect: "arcane_blast", description: "Destroy a monster with 1500 ATK or less." },
  { defId: "s_quick_draw", name: "Quick Draw", type: "spell", effect: "quick_draw", description: "Draw 2 cards." },
  { defId: "s_mirror_shield", name: "Mirror Shield", type: "spell", effect: "mirror_shield", description: "Target your monster gains +600 DEF this turn." },
  { defId: "s_sabotage", name: "Sabotage", type: "spell", effect: "sabotage", description: "Target opponent monster loses 500 ATK this turn." },
];

export const ALL_DEFS: Record<string, CardDef> = Object.fromEntries(
  [...MONSTER_DEFS, ...SPELL_DEFS].map((c) => [c.defId, c])
);

/** Builds one 30-card deck: every monster x1, the 4 strongest monsters x1 more (20 monsters), plus 10 spells. */
export function buildDeckList(): string[] {
  const ids: string[] = MONSTER_DEFS.map((c) => c.defId);
  const strongest = [...MONSTER_DEFS]
    .sort((a, b) => (b.atk ?? 0) - (a.atk ?? 0))
    .slice(0, 4)
    .map((c) => c.defId);
  ids.push(...strongest);

  let spellCount = 0;
  while (spellCount < 10) {
    ids.push(SPELL_DEFS[spellCount % SPELL_DEFS.length].defId);
    spellCount++;
  }
  return ids;
}
