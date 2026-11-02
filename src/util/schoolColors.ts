/**
 * Pinned-school colors, in fixed order: school 1 always gets slot 1, and so on.
 * Shared by every view so a school keeps its color across tabs.
 *
 * Validated categorical palette (dataviz validator, light surface): adjacent pairs
 * pass colorblind and normal-vision separation. Slots 3-5 are under 3:1 contrast,
 * so charts that use them always name schools on an axis, legend or table too.
 *
 * Eight is the most series one chart can tell apart, hence MAX_PINS.
 */
export const SCHOOL_COLORS = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#6250d6', // violet
  '#e34948', // red
] as const;

export const MAX_PINS = SCHOOL_COLORS.length;
