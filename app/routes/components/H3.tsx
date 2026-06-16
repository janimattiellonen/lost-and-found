import * as stylex from '@stylexjs/stylex';

import { font } from '~/styles/tokens.stylex';

const styles = stylex.create({
  // Preserves the original markup: this component renders an <h2> element.
  heading: {
    fontWeight: font.weightBold,
    fontSize: {
      default: font.sizeMd,
      '@media (min-width: 600px)': '1.5rem',
    },
  },
});

type H3Props = {
  children: JSX.Element | string;
  className?: string;
};

export default function H3({ children, className }: H3Props): JSX.Element {
  const { className: sxClassName, style } = stylex.props(styles.heading);
  return (
    <h2 className={[sxClassName, className].filter(Boolean).join(' ')} style={style}>
      {children}
    </h2>
  );
}
