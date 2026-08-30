import * as stylex from '@stylexjs/stylex';

import { NavLink } from 'react-router';

import Button from '~/ui/Button';
import { color, radius, space } from '~/styles/tokens.stylex';

import type { JSX } from 'react';

const links = [
  { to: '/', label: 'Kiekot' },
  { to: '/discs/add', label: 'Lisää kiekkoja' },
  { to: '/emptying-log', label: 'Tyhjennysloki' },
  { to: '/message-templates', label: 'Viestipohjat' },
  { to: '/stats', label: 'Statistiikka' },
  { to: '/notifications', label: 'Ilmoitukset' },
];

// StyleX has no descendant selectors, so hover/active styling is applied to the
// links themselves rather than through the surrounding <nav>.
const styles = stylex.create({
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.sm,
    padding: `${space.sm} ${space.md}`,
    backgroundColor: color.surfaceMuted,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: color.border,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  list: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.xs,
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  link: {
    display: 'inline-block',
    padding: `${space.xs} ${space.sm}`,
    borderRadius: radius.sm,
    color: { default: color.textSecondary, ':hover': color.accent },
    backgroundColor: { default: 'transparent', ':hover': color.surface },
    fontSize: '0.9375rem',
    textDecoration: 'none',
    transition: 'background-color 0.15s, color 0.15s',
  },
  activeLink: {
    color: color.accent,
    backgroundColor: color.surface,
    fontWeight: 600,
    boxShadow: 'inset 0 -2px 0 0 currentColor',
  },
  spacer: {
    marginLeft: 'auto',
  },
});

export default function AdminMenu({ supabase, user }: any): JSX.Element | null {
  const handleLogout = async () => {
    if (!window.confirm('Haluatko varmasti kirjautua ulos?')) {
      return;
    }

    await supabase.auth.signOut();
  };

  if (user?.email == null) {
    return null;
  }

  return (
    <nav {...stylex.props(styles.nav)}>
      <ul {...stylex.props(styles.list)}>
        {links.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => stylex.props(styles.link, isActive && styles.activeLink).className ?? ''}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div {...stylex.props(styles.spacer)}>
        <Button variant="contained" color="error" size="small" onClick={handleLogout}>
          Kirjaudu ulos
        </Button>
      </div>
    </nav>
  );
}
