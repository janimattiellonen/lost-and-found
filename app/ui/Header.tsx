import * as stylex from '@stylexjs/stylex';

import type { JSX } from 'react';

type HeaderProps = {
  clubId: number;
  clubName: string;
};

const styles = stylex.create({
  logo: {
    width: { default: '50px', '@media (min-width: 600px)': '100px' },
  },
  h1: {
    fontSize: { default: '1.5rem', '@media (min-width: 600px)': '2.25rem' },
  },
});

const CLUB_LOGOS: Record<number, string> = {
  1: '/ps-logo.png',
  2: '/tt-sini-logo.jpg',
};

export default function Header({ clubId, clubName }: HeaderProps): JSX.Element {
  const logo = stylex.props(styles.logo);
  const logoUrl = CLUB_LOGOS[clubId];

  return (
    <div className="flex items-center">
      {logoUrl && <img className={`mr-4 ${logo.className ?? ''}`} style={logo.style} src={logoUrl} alt={''} />}
      <h1 {...stylex.props(styles.h1)}>Löytökiekot - {clubName}</h1>
    </div>
  );
}
