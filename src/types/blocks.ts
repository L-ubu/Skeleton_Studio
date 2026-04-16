export type BlockCategory = "hand_trigger" | "continuous_trigger" | "action" | "flow" | "modifier";

export interface BlockDefinition {
  id: string;
  category: BlockCategory;
  label: string;
  color: string;
  icon: string;
  defaultProps: Record<string, any>;
}

export interface BlockInstance {
  id: string;
  definitionId: string;
  props: Record<string, any>;
}

export interface Chain {
  id: string;
  blocks: BlockInstance[];
  enabled: boolean;
  name: string;
}

export type LayoutMode = "scratch" | "split" | "canvas";

export interface EngineStatus {
  running: boolean;
  enabled: boolean;
  fps: number;
  hands: number;
  currentGesture: string | null;
  confidence: number;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // Hand triggers (green)
  { id: "open_palm", category: "hand_trigger", label: "Open Palm", color: "#00ff88", icon: "\u270b", defaultProps: { hand: "any", dwell_ms: 400, cooldown_ms: 2000 } },
  { id: "fist", category: "hand_trigger", label: "Fist", color: "#00ff88", icon: "\u270a", defaultProps: { hand: "any", dwell_ms: 400, cooldown_ms: 800 } },
  { id: "peace", category: "hand_trigger", label: "Peace", color: "#00ff88", icon: "\u270c\ufe0f", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  { id: "point", category: "hand_trigger", label: "Point", color: "#00ff88", icon: "\ud83d\udc46", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  { id: "thumbs_up", category: "hand_trigger", label: "Thumbs Up", color: "#00ff88", icon: "\ud83d\udc4d", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  { id: "rock", category: "hand_trigger", label: "Rock", color: "#00ff88", icon: "\ud83e\udd1f", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  { id: "pinch", category: "hand_trigger", label: "Pinch", color: "#00ff88", icon: "\ud83e\udd0f", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  { id: "three_fingers", category: "hand_trigger", label: "Three Fingers", color: "#00ff88", icon: "\ud83d\udd96", defaultProps: { hand: "any", dwell_ms: 300, cooldown_ms: 500 } },
  // Continuous triggers (teal)
  { id: "pinch_distance", category: "continuous_trigger", label: "Pinch Distance", color: "#00ccaa", icon: "\ud83d\udccf", defaultProps: { hand: "any", smoothing: 0.3, dead_zone: 0.03, activation_ms: 800 } },
  { id: "hand_rotation", category: "continuous_trigger", label: "Hand Rotation", color: "#00ccaa", icon: "\ud83d\udd04", defaultProps: { hand: "any", smoothing: 0.3, dead_zone: 0.02, activation_ms: 0 } },
  { id: "palm_height", category: "continuous_trigger", label: "Palm Height", color: "#00ccaa", icon: "\ud83d\udcd0", defaultProps: { hand: "any", smoothing: 0.3, dead_zone: 0.02, activation_ms: 0 } },
  { id: "hand_spread", category: "continuous_trigger", label: "Hand Spread", color: "#00ccaa", icon: "\ud83d\udd90\ufe0f", defaultProps: { hand: "any", smoothing: 0.3, dead_zone: 0.02, activation_ms: 0 } },
  { id: "fist_squeeze", category: "continuous_trigger", label: "Fist Squeeze", color: "#00ccaa", icon: "\ud83d\udcaa", defaultProps: { hand: "any", smoothing: 0.3, dead_zone: 0.02, activation_ms: 0 } },
  // Actions (gold)
  { id: "keypress", category: "action", label: "Keypress", color: "#ffd700", icon: "\u2328\ufe0f", defaultProps: { keys: "" } },
  { id: "mouse_click", category: "action", label: "Mouse Click", color: "#ffd700", icon: "\ud83d\uddb1\ufe0f", defaultProps: { button: "left" } },
  { id: "shell_command", category: "action", label: "Shell Command", color: "#ffd700", icon: "\ud83d\udcbb", defaultProps: { command: "" } },
  { id: "play_sound", category: "action", label: "Play Sound", color: "#ffd700", icon: "\ud83d\udd0a", defaultProps: { path: "", volume: 1.0 } },
  { id: "notification", category: "action", label: "Notification", color: "#ffd700", icon: "\ud83d\udd14", defaultProps: { title: "", body: "" } },
  // Flow (blue)
  { id: "delay", category: "flow", label: "Delay", color: "#4488ff", icon: "\u23f1\ufe0f", defaultProps: { duration_ms: 100 } },
  { id: "repeat", category: "flow", label: "Repeat", color: "#4488ff", icon: "\ud83d\udd01", defaultProps: { count: 2 } },
  // Modifiers (purple)
  { id: "set_hand", category: "modifier", label: "Set Hand", color: "#aa66ff", icon: "\ud83e\udef2", defaultProps: { hand: "left" } },
  { id: "set_dwell", category: "modifier", label: "Set Dwell", color: "#aa66ff", icon: "\u23f3", defaultProps: { dwell_ms: 300 } },
  { id: "set_cooldown", category: "modifier", label: "Set Cooldown", color: "#aa66ff", icon: "\u2744\ufe0f", defaultProps: { cooldown_ms: 500 } },
  { id: "set_confidence", category: "modifier", label: "Set Confidence", color: "#aa66ff", icon: "\ud83c\udfaf", defaultProps: { threshold: 0.7 } },
];
