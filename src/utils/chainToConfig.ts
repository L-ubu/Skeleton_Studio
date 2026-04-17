import { Chain, BLOCK_DEFINITIONS, type BlockInstance } from "../types/blocks";

function toEngineAction(block: BlockInstance): any {
  const id = block.definitionId;
  const p = block.props;

  if (id === "keypress") return { type: "keypress", keys: p.keys };
  if (id === "mouse_click") return { type: "mouse_click", button: p.button };
  if (id === "shell_command") return { type: "shell", command: p.command };
  if (id === "volume") return { type: "volume", update_interval_ms: p.update_interval_ms, invert: p.invert };
  if (id === "brightness") return { type: "brightness", update_interval_ms: p.update_interval_ms, invert: p.invert };
  if (id === "scroll") return { type: "scroll", direction: p.direction, update_interval_ms: p.update_interval_ms };
  if (id === "zoom") return { type: "zoom", update_interval_ms: p.update_interval_ms };
  if (id === "play_sound") return { type: "shell", command: `afplay "${p.path}"` };
  if (id === "notification") {
    const t = (p.title || "").replace(/"/g, '\\"');
    const b = (p.body || "").replace(/"/g, '\\"');
    return { type: "shell", command: `osascript -e 'display notification "${b}" with title "${t}"'` };
  }
  return { type: id, ...p };
}

export function chainsToEngineConfig(chains: Chain[]) {
  const gestures: Record<string, any> = {};
  const continuous: Record<string, any> = {};

  for (const chain of chains) {
    if (!chain.enabled || chain.blocks.length === 0) continue;

    const trigger = chain.blocks[0];
    const triggerDef = BLOCK_DEFINITIONS.find((d) => d.id === trigger.definitionId);
    if (!triggerDef) continue;

    const rest = chain.blocks.slice(1);

    // Collect modifier overrides
    let handOverride: string | null = null;
    let dwellOverride: number | null = null;
    let cooldownOverride: number | null = null;
    let confidenceOverride: number | null = null;

    for (const b of rest) {
      if (b.definitionId === "set_hand") handOverride = b.props.hand;
      if (b.definitionId === "set_dwell") dwellOverride = b.props.dwell_ms;
      if (b.definitionId === "set_cooldown") cooldownOverride = b.props.cooldown_ms;
      if (b.definitionId === "set_confidence") confidenceOverride = b.props.threshold;
    }

    // Collect action blocks (skip modifiers and flow)
    const actionBlocks = rest.filter((b) => {
      const d = BLOCK_DEFINITIONS.find((dd) => dd.id === b.definitionId);
      return d?.category === "action";
    });
    if (actionBlocks.length === 0) continue;

    // Build action — single action or macro with delay/repeat
    let action: any;
    const hasFlow = rest.some((b) => {
      const d = BLOCK_DEFINITIONS.find((dd) => dd.id === b.definitionId);
      return d?.category === "flow";
    });

    if (actionBlocks.length === 1 && !hasFlow) {
      action = toEngineAction(actionBlocks[0]);
    } else {
      // Build macro steps in order
      const steps: any[] = [];
      for (const b of rest) {
        const d = BLOCK_DEFINITIONS.find((dd) => dd.id === b.definitionId);
        if (!d) continue;
        if (d.category === "modifier") continue;
        if (b.definitionId === "delay") {
          steps.push({ delay_ms: b.props.duration_ms });
        } else if (b.definitionId === "repeat") {
          // Repeat the previous action step N-1 more times
          const count = (b.props.count || 2) - 1;
          const prev = steps.filter((s) => s.type)[steps.filter((s) => s.type).length - 1];
          if (prev) for (let i = 0; i < count; i++) steps.push({ ...prev });
        } else if (d.category === "action") {
          steps.push(toEngineAction(b));
        }
      }
      action = steps.length === 1 ? steps[0] : { type: "macro", steps };
    }

    const hand = handOverride || trigger.props.hand;

    if (triggerDef.category === "hand_trigger") {
      const key = hand && hand !== "any" ? `${trigger.definitionId}:${hand}` : trigger.definitionId;
      gestures[key] = {
        action,
        hand: hand || "any",
        dwell_ms: dwellOverride ?? trigger.props.dwell_ms,
        cooldown_ms: cooldownOverride ?? trigger.props.cooldown_ms,
        confidence: confidenceOverride ?? 0.7,
      };
    } else if (triggerDef.category === "continuous_trigger") {
      const key = hand && hand !== "any" ? `${trigger.definitionId}:${hand}` : trigger.definitionId;
      continuous[key] = {
        action,
        smoothing: trigger.props.smoothing,
        dead_zone: trigger.props.dead_zone,
        activation_ms: trigger.props.activation_ms,
      };
    }
  }

  return { version: 1, settings: {}, gestures, continuous };
}
