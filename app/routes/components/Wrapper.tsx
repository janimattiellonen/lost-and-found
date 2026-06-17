import type { ReactNode, JSX } from 'react';

import * as stylex from '@stylexjs/stylex';

import { space } from '~/styles/tokens.stylex';

const styles = stylex.create({
  wrapper: {
    width: '100%',
    maxWidth: '40rem',
    marginBottom: space.md,
  },
});

type WrapperProps = {
  className?: string;
  children: ReactNode;
};

export default function Wrapper({ className, children }: WrapperProps): JSX.Element {
  const { className: sxClassName, style } = stylex.props(styles.wrapper);
  return (
    <div className={[sxClassName, className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  );
}
