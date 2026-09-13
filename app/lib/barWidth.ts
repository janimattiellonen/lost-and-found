/**
 * How wide a bar is drawn, as a percentage of the space it has.
 *
 * The `+ 30` is why it is shared rather than written twice: no bar is ever full
 * width, and a chart of small numbers stays visibly small instead of being
 * stretched until three discs look like a busy month. Both bar charts have to
 * scale the same way, or two charts on one page cannot be read against each
 * other.
 */
export function toBarWidth(value: number, highest: number): number {
  return Math.round((value / (highest + 30)) * 100);
}
