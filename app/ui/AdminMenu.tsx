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

/**
 * The menu, with the retrieval list in it for the one club that keeps one.
 *
 * The count is what the item is for: it says at a glance whether there is
 * anything to fetch on the next trip to the storage. An empty list carries no
 * number rather than a "(0)", which would read as something to act on.
 */
function menuLinks(retrievalCount: number | null): { to: string; label: string }[] {
  if (retrievalCount === null) {
    return links;
  }

  const label = retrievalCount > 0 ? `Noutolista (${retrievalCount})` : 'Noutolista';

  return [...links, { to: '/retrieval', label }];
}

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

type AdminMenuProps = {
  supabase: any;
  user: any;
  /**
   * Discs waiting to be fetched from the club's storage, or null when this club
   * keeps no retrieval list -- and so has no menu item for it.
   */
  retrievalCount: number | null;
};

export default function AdminMenu({ supabase, user, retrievalCount }: AdminMenuProps): JSX.Element | null {
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
        {menuLinks(retrievalCount).map(({ to, label }) => (
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
