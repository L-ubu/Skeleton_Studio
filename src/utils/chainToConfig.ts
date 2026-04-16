import { Chain, BLOCK_DEFINITIONS } from "../types/blocks";

export function chainsToEngineConfig(chains: Chain[]) {
  const gestures: Record<string, any> = {};
  const continuous: Record<string, any> = {};

  for (const chain of chains) {
    if (!chain.enabled || chain.blocks.length === 0) continue;

    const trigger = chain.blocks[0];
    const triggerDef = BLOCK_DEFINITIONS.find((d) => d.id === trigger.definitionId);
    if (!triggerDef) continue;

    const actionBlocks = chain.blocks.slice(1);
    const firstAction = actionBlocks.find((b) => {
      const d = BLOCK_DEFINITIONS.find((dd) => dd.id === b.definitionId);
      return d?.category === "action";
    });

    if (triggerDef.category === "hand_trigger" && firstAction) {
      const actionDef = BLOCK_DEFINITIONS.find((d) => d.id === firstAction.definitionId);
      if (!actionDef) continue;

      const action: any = { type: firstAction.definitionId, ...firstAction.props };
      gestures[trigger.definitionId] = {
        action,
        dwell_ms: trigger.props.dwell_ms,
        cooldown_ms: trigger.props.cooldown_ms,
      };
    } else if (triggerDef.category === "continuous_trigger" && firstAction) {
      const hand = trigger.props.hand;
      const key = hand && hand !== "any" ? `${trigger.definitionId}:${hand}` : trigger.definitionId;
      const action: any = { type: firstAction.definitionId, ...firstAction.props };
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
