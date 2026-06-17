import * as stylex from '@stylexjs/stylex';

import { color, radius, space } from '~/styles/tokens.stylex';

import type { JSX } from "react";

const styles = stylex.create({
  // Replaces MUI <Paper elevation={1}> + the `mt-8 p-4` Tailwind utilities.
  // Shadow is MUI's exact elevation-1 value; radius is MUI's default (4px).
  paper: {
    marginTop: space.xl,
    padding: space.md,
    backgroundColor: color.surface,
    color: color.textPrimary,
    borderRadius: radius.sm,
    boxShadow:
      '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
  },
});

type PaperItemProps = {
  children: string | JSX.Element | JSX.Element[];
};

export default function PaperItem({ children }: PaperItemProps): JSX.Element {
  return <div {...stylex.props(styles.paper)}>{children}</div>;
}
