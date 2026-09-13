import { Fragment, useState, type JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import H3 from '~/ui/H3';
import { toBarWidth } from '~/lib/barWidth';
import { color, font, space } from '~/styles/tokens.stylex';

export type BarValueType = {
  label: string;
  value: number;
  date?: Date;
  /** Heads the rows that share it, e.g. the year over its months. */
  group?: string;
};

type BarChartProps = {
  className?: string;
  data: BarValueType[];
  onBarClick?: (date?: Date) => void;
  title: string;
};

/**
 * Horizontal bars, one per row, each row reading label, bar, value.
 *
 * Rows rather than columns because the labels are the thing the reader looks
 * up: a month name under a vertical bar has only the bar's width to fit in,
 * and a chart with two years of months on it cannot give it more.
 *
 * A row is a `<button>` when the chart is clickable, so the whole row — not
 * just the coloured part, which for a small month is a few pixels — is the
 * target, is keyboard-reachable, and lights its bar from anywhere along it. Without `onBarClick` it is a plain `<div>`,
 * because a button that does nothing is a promise the chart cannot keep.
 *
 * Rows carrying a `group` are headed by it wherever it changes, so two years of
 * months read as two blocks of twelve rather than one run of twenty-five. The
 * heading is drawn on the change alone, not on a regrouping of the data: the
 * rows arrive in date order, so a group is always contiguous, and one that was
 * not would be visible as a repeated heading rather than silently reordered.
 */
export default function BarChart({ className, data, onBarClick, title }: BarChartProps): JSX.Element {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  // The row the pointer or the keyboard is on. Held here rather than left to a
  // `:hover` rule on the bar, because the row is the target and the bar is only
  // part of it: pointing at a quiet month's label would otherwise light nothing.
  const [activeBar, setActiveBar] = useState<number | null>(null);

  let highest = 0;

  data.forEach((item: BarValueType) => {
    if (item.value > highest) {
      highest = item.value;
    }
  });

  const outer = stylex.props(styles.outer);

  return (
    <div className={[outer.className, className].filter(Boolean).join(' ')} style={outer.style}>
      <H3>{title}</H3>
      {data.map((item: BarValueType, index: number) => {
        const width = toBarWidth(item.value, highest);
        const startsGroup = item.group !== undefined && item.group !== data[index - 1]?.group;
        // A row with nothing in it is not a target: it is drawn so the month is
        // visibly a month with no discs rather than a month left out, and there
        // is nothing for it to open.
        const clickable = Boolean(onBarClick) && item.value > 0;
        const Row = clickable ? 'button' : 'div';
        const rowProps =
          clickable && onBarClick
            ? {
                type: 'button' as const,
                onClick: () => {
                  setSelectedBar(index);
                  onBarClick(item.date);
                },
                onMouseEnter: () => setActiveBar(index),
                onMouseLeave: () => setActiveBar(null),
                onFocus: () => setActiveBar(index),
                onBlur: () => setActiveBar(null),
              }
            : {};

        return (
          <Fragment key={index}>
            {startsGroup && <div {...stylex.props(styles.groupHeading)}>{item.group}</div>}
            <Row {...rowProps} {...stylex.props(styles.row, clickable && styles.rowClickable)}>
              <div {...stylex.props(styles.label)}>{item.label}</div>
              <div {...stylex.props(styles.track)}>
                <div
                  {...stylex.props(
                    styles.barBase,
                    styles.barDynamic(width, index === selectedBar || index === activeBar ? 'blue' : 'red'),
                  )}
                />
                <div {...stylex.props(styles.barValue)}>{item.value}</div>
              </div>
            </Row>
          </Fragment>
        );
      })}
    </div>
  );
}

const styles = stylex.create({
  outer: { display: 'flex', flexDirection: 'column' },
  // Rendered as a <button> when the chart is clickable, with a button reset.
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: space.md,
    width: '100%',
    appearance: 'none',
    borderStyle: 'none',
    backgroundColor: 'transparent',
    paddingBlock: space.xs,
    paddingInline: 0,
    textAlign: 'left',
    fontFamily: 'inherit',
    fontSize: font.sizeMd,
    color: color.textPrimary,
  },
  rowClickable: { cursor: 'pointer' },
  // Set apart from the rows under it by weight and by the space above it, so a
  // year reads as a heading rather than as another label in the column.
  groupHeading: {
    marginTop: space.md,
    marginBottom: space.xs,
    fontWeight: font.weightBold,
    color: color.textSecondary,
  },
  label: { width: '5rem', flexShrink: 0 },
  // The bar and its figure share the space the label leaves, so the figure
  // always sits just past the end of its own bar.
  track: { display: 'flex', alignItems: 'center', gap: space.sm, flexGrow: 1, minWidth: 0 },
  barBase: { height: '18px', flexShrink: 0 },
  // Dynamic per-bar width/colour.
  barDynamic: (width: number, colour: string) => ({ width: `${width}%`, backgroundColor: colour }),
  barValue: { color: 'black' },
});
