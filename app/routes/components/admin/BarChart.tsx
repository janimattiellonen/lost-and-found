import { useState } from 'react';

import * as stylex from '@stylexjs/stylex';

import H3 from '../H3';
import { space } from '~/styles/tokens.stylex';

const styles = stylex.create({
  outer: { display: 'flex', flexDirection: 'column' },
  wrapper: { width: '100%', height: '200px', display: 'flex', alignItems: 'self-end', gap: space.md },
  legend: { display: 'flex', gap: space.md, width: '100%', maxWidth: '1200px' },
  legendItem: { width: '75px', textAlign: 'center' },
  // Rendered as a <button> (the bars are clickable) with a button reset.
  barBase: {
    position: 'relative',
    width: '75px',
    appearance: 'none',
    borderStyle: 'none',
    padding: 0,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  // Dynamic per-bar height/colour. Background must be StyleX (not inline style)
  // so the :hover rule can override it.
  barDynamic: (height: number, colour: string) => ({ height: `${height}%`, backgroundColor: colour }),
  barHover: { backgroundColor: { ':hover': 'blue' } },
  barValue: {
    position: 'absolute',
    top: '-25px',
    width: '100%',
    marginBlock: 0,
    marginInline: 'auto',
    color: 'black',
  },
  barValueInner: { textAlign: 'center' },
});

export type BarValueType = {
  label: string;
  value: number;
  date?: Date;
};

type BarChartProps = {
  className?: string;
  data: BarValueType[];
  legendItems: string[];
  onBarClick?: (e: any) => void;
  title: string;
};

export default function BarChart({ className, data, legendItems, onBarClick, title }: BarChartProps): JSX.Element {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

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
      <div {...stylex.props(styles.wrapper)}>
        {data.map((item: BarValueType, index: number) => {
          const height = Math.round((item.value / (highest + 30)) * 100);
          return (
            <button
              key={index}
              type="button"
              {...stylex.props(styles.barBase, styles.barHover, styles.barDynamic(height, index === selectedBar ? 'blue' : 'red'))}
              onClick={() => {
                if (onBarClick) {
                  setSelectedBar(index);
                  onBarClick(item.date);
                }
              }}
            >
              <div {...stylex.props(styles.barValue)}>
                <div {...stylex.props(styles.barValueInner)}>{item.value}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div {...stylex.props(styles.legend)}>
        {legendItems.map((item, index: number) => (
          <div key={index} {...stylex.props(styles.legendItem)}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
