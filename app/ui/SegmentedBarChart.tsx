import * as stylex from '@stylexjs/stylex';

import { color, font, space } from '~/styles/tokens.stylex';
import { toBarWidth } from '~/lib/barWidth';

import type { JSX } from 'react';

/** One part of the optional second bar: a caption and its share of the total. */
type Segment = {
  label: string;
  value: number;
};

type Stat = {
  label: string;
  value: number;
  /** When present, a second bar of the same length, divided into these parts. */
  segments?: Segment[];
};

type SegmentedBarChartProps = {
  data: Stat[];
};

/**
 * Categorical hues for the segmented bar, in fixed order.
 *
 * A segment is assigned a colour by its caption's position in `segmentOrder`
 * below — the chart's full list of captions — rather than by its position in
 * its own bar, so one year is the same colour on every row and a model that
 * skips a year does not shift the colours of the ones around it.
 *
 * The eight are a colourblind-safe set: worst adjacent pair 9.1 ΔE simulated,
 * 19.6 unsimulated. Three of them sit below 3:1 contrast on white, which is
 * what the caption under every segment relieves. They are not cycled: a ninth
 * segment would draw uncoloured rather than repeat a hue.
 */
const segmentColours = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

export default function SegmentedBarChart({ data }: SegmentedBarChartProps): JSX.Element {
  let highest: number = 0;

  data.forEach((item: Stat) => {
    if (item.value > highest) {
      highest = item.value;
    }
  });

  // Sorted, not insertion-ordered: the colour a caption gets must not depend on
  // which bar happens to be first, or on whether the top bar has every caption.
  const segmentOrder = [
    ...new Set(data.flatMap((item) => item.segments?.map((segment) => segment.label) ?? [])),
  ].sort();

  return (
    <div>
      {data.map((item: Stat, index: number) => {
        const width = toBarWidth(item.value, highest);

        return (
          <div key={index}>
            <div {...stylex.props(styles.wrapper)}>
              <div {...stylex.props(styles.label)}>{item.label}</div>
              <div {...stylex.props(styles.barBase, styles.barDynamic(width, 'red'))}>
                <div {...stylex.props(styles.barValue)}>{item.value}</div>
              </div>
            </div>

            {/* `&&` on the array alone would let an empty one through as
                truthy, drawing a zero-width bar with a stray 0 beneath it. */}
            {item.segments && item.segments.length > 0 && (
              <SegmentedBar
                label={item.label}
                total={item.value}
                width={width}
                segments={item.segments}
                segmentOrder={segmentOrder}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The second bar under a plain one, divided into its parts.
 *
 * It is as long as the bar above only when the parts account for the whole
 * total. They are laid out with `flexGrow`, which always fills whatever width
 * the bar is given, so scaling that width by what the parts cover is the only
 * thing that makes a shortfall visible — otherwise a total of 112 split into
 * parts summing to 111 would silently stretch those parts across the full bar.
 * The figure printed at the end is what the parts actually come to, for the
 * same reason.
 *
 * The label is repeated beside it so a row still reads left to right when the
 * two bars are scrolled apart from their heading.
 */
function SegmentedBar({
  label,
  total,
  width,
  segments,
  segmentOrder,
}: {
  label: string;
  total: number;
  width: number;
  segments: Segment[];
  segmentOrder: string[];
}): JSX.Element {
  const covered = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div {...stylex.props(styles.wrapper)}>
      <div {...stylex.props(styles.label)}>{label}</div>

      <div {...stylex.props(styles.segmentedBar, styles.widthDynamic((width * covered) / total))}>
        <div {...stylex.props(styles.barBase, styles.segmentRow)}>
          {segments.map((segment) => (
            <div
              key={segment.label}
              {...stylex.props(
                styles.segment,
                // Past the eighth caption there is no hue left, and the part
                // draws uncoloured rather than repeating one.
                styles.segmentDynamic(
                  segment.value,
                  segmentColours[segmentOrder.indexOf(segment.label)] ?? 'transparent',
                ),
              )}
            />
          ))}
          <div {...stylex.props(styles.barValue)}>{covered}</div>
        </div>

        <div {...stylex.props(styles.captionRow)}>
          {segments.map((segment, index) => (
            <div
              key={segment.label}
              {...stylex.props(
                styles.caption,
                index % 2 === 1 && styles.captionLower,
                styles.growDynamic(segment.value),
              )}
            >
              {segment.label} - {segment.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = stylex.create({
  wrapper: { display: 'flex', justifyContent: 'flex-start' },
  label: { width: '10rem', marginRight: space.md },
  barBase: { position: 'relative', height: '25px', marginBottom: space.sm },
  // Dynamic per-bar width/colour.
  barDynamic: (width: number, colour: string) => ({ width: `${width}%`, backgroundColor: colour }),
  barValue: { position: 'absolute', right: '-25px', color: 'black' },
  // The segmented bar matches the plain bar above it, so the two are comparable
  // by eye and the parts visibly sum to the whole.
  segmentedBar: { marginBottom: space.md },
  widthDynamic: (width: number) => ({ width: `${width}%` }),
  segmentRow: { display: 'flex', marginBottom: 0 },
  // A 2px white gap keeps two adjacent hues from reading as one block.
  segment: { minWidth: 0, borderRightWidth: '2px', borderRightStyle: 'solid', borderRightColor: color.surface },
  segmentDynamic: (value: number, colour: string) => ({ flexGrow: value, backgroundColor: colour }),
  // Two lines tall, with every other caption on the lower one. A part narrower
  // than its caption is common — a model logged four times in one year and
  // twenty in the next gets about a sixth of the bar — and neighbouring
  // captions would otherwise run into each other ("2024 - 52025 - 5").
  // Staggering them means a caption can only ever meet the one two parts away.
  captionRow: { display: 'flex', height: '2.6em' },
  caption: {
    minWidth: 0,
    flexBasis: 0,
    alignSelf: 'flex-start',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    fontSize: font.sizeSm,
    color: color.textSecondary,
  },
  captionLower: { alignSelf: 'flex-end' },
  growDynamic: (value: number) => ({ flexGrow: value }),
});
