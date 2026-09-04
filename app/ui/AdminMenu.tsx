import * as stylex from '@stylexjs/stylex';

import { NavLink } from 'react-router';

import Button from '~/ui/Button';
import { color, radius, space } from '~/styles/tokens.stylex';

import type { JSX } from 'react';

type MenuLink = { to: string; label: string };

const links: MenuLink[] = [
  { to: '/', label: 'Kiekot' },
  { to: '/discs/add', label: 'Lisää kiekkoja' },
  { to: '/emptying-log', label: 'Tyhjennysloki' },
  { to: '/message-templates', label: 'Viestipohjat' },
  { to: '/stats', label: 'Statistiikka' },
  { to: '/notifications', label: 'Ilmoitukset' },
];

/**
 * A count in parentheses, or nothing.
 *
 * An empty list carries no number rather than a "(0)", which reads as
 * something to act on.
 */
function withCount(label: string, count: number): string {
  return count > 0 ? `${label} (${count})` : label;
}

/**
 * The menu, with the two counted items in it when they apply.
 *
 * The counts are what those items are for: whether anyone has answered about
 * their disc, and whether the next trip to the storage has anything in it. Both
 * are null when there is nothing to count -- nobody signed in, or a club that
 * keeps no retrieval list -- and the item is then absent rather than empty.
 *
 * Answers come before the errand they may become, and the retrieval list stays
 * last, where it has been.
 */
function menuLinks(retrievalCount: number | null, responseCount: number | null): MenuLink[] {
  const responses: MenuLink[] =
    responseCount === null ? [] : [{ to: '/vastaukset', label: withCount('Vastaukset', responseCount) }];

  const retrieval: MenuLink[] =
    retrievalCount === null ? [] : [{ to: '/retrieval', label: withCount('Noutolista', retrievalCount) }];

  return [...links.slice(0, 2), ...responses, ...links.slice(2), ...retrieval];
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
  /** Owners' answers not yet dealt with, or null when nobody is signed in. */
  responseCount: number | null;
};

export default function AdminMenu({
  supabase,
  user,
  retrievalCount,
  responseCount,
}: AdminMenuProps): JSX.Element | null {
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
        {menuLinks(retrievalCount, responseCount).map(({ to, label }) => (
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
