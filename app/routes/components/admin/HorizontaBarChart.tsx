import * as stylex from '@stylexjs/stylex';

import { space } from '~/styles/tokens.stylex';

type Stat = {
  label: string;
  value: number;
};

type HorizontalBarChartProps = {
  data: Stat[];
};

const styles = stylex.create({
  wrapper: { display: 'flex', justifyContent: 'flex-start' },
  label: { width: '10rem', marginRight: space.md },
  barBase: { position: 'relative', height: '25px', marginBottom: space.sm },
  // Dynamic per-bar width/colour.
  barDynamic: (width: number, colour: string) => ({ width: `${width}%`, backgroundColor: colour }),
  barValue: { position: 'absolute', right: '-25px', color: 'black' },
});

export default function HorizontalBarChart({ data }: HorizontalBarChartProps): JSX.Element {
  let highest: number = 0;

  data.forEach((item: Stat) => {
    if (item.value > highest) {
      highest = item.value;
    }
  });

  return (
    <div>
      {data.map((item: Stat, index: number) => {
        const width = Math.round((item.value / (highest + 30)) * 100);

        return (
          <div key={index} {...stylex.props(styles.wrapper)}>
            <div {...stylex.props(styles.label)}>{item.label}</div>
            <div {...stylex.props(styles.barBase, styles.barDynamic(width, 'red'))}>
              <div {...stylex.props(styles.barValue)}>{item.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
