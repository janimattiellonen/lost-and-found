import * as stylex from '@stylexjs/stylex';

import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';

import Button from '~/ui/Button';
import { CloseIcon, MenuIcon } from '~/ui/icons';
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

// The width at which the links stop being a row in the bar and start being a
// panel behind the hamburger button. Kept in one place so the bar, the button
// and the panel cannot disagree about it -- a link reachable in both at the same
// width would sit twice in the tab order.
const DESKTOP = '(min-width: 768px)';

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
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  // Nothing behind the panel may scroll while it is open. Cleared on unmount as
  // well as on close, so signing out from inside the panel cannot leave the
  // next page permanently stuck.
  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isPanelOpen]);

  // The panel only exists below the breakpoint. Widening the window past it
  // hides the panel by CSS, so the state has to follow -- otherwise the scroll
  // lock above would outlive the thing that asked for it.
  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    const desktop = window.matchMedia(DESKTOP);
    const onChange = () => desktop.matches && closePanel();

    desktop.addEventListener('change', onChange);

    return () => desktop.removeEventListener('change', onChange);
  }, [isPanelOpen, closePanel]);

  // Focus starts on the close button, Escape closes, and Tab cycles inside the
  // panel instead of walking into the page behind it. Focus goes back to the
  // hamburger on close, so a keyboard user is not dropped at the top of the
  // document.
  useEffect(() => {
    const panel = panelRef.current;

    if (!isPanelOpen || panel == null) {
      return;
    }

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePanel();
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (first == null) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPanelOpen, closePanel]);

  const handleLogout = async () => {
    if (!window.confirm('Haluatko varmasti kirjautua ulos?')) {
      return;
    }

    await supabase.auth.signOut();
  };

  if (user?.email == null) {
    return null;
  }

  const items = menuLinks(retrievalCount, responseCount);
  // What is waiting on the two counted pages. While the panel is shut, the
  // hamburger is the only place that can say so.
  const pending = (retrievalCount ?? 0) + (responseCount ?? 0);

  const logoutButton = (
    <Button variant="contained" color="error" size="small" onClick={handleLogout}>
      Kirjaudu ulos
    </Button>
  );

  return (
    <>
      <nav {...stylex.props(styles.nav)} aria-label="Päävalikko">
        <ul {...stylex.props(styles.list)}>
          {items.map(({ to, label }) => (
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
        <div {...stylex.props(styles.desktopActions)}>{logoutButton}</div>
        <button
          ref={toggleRef}
          type="button"
          {...stylex.props(styles.toggle)}
          onClick={() => setIsPanelOpen(true)}
          aria-label={pending > 0 ? `Avaa valikko, ${pending} odottaa käsittelyä` : 'Avaa valikko'}
          aria-expanded={isPanelOpen}
          aria-controls="admin-menu-panel"
        >
          <MenuIcon />
          {pending > 0 && (
            <span {...stylex.props(styles.badge)} aria-hidden="true">
              {pending}
            </span>
          )}
        </button>
      </nav>

      {isPanelOpen && (
        <>
          {/* Mouse-and-thumb convenience only: the keyboard closes the panel with
              Escape or the close button, so the screen reader is better off not
              hearing about this at all. tabIndex -1 keeps it out of the tab order,
              which is what makes aria-hidden legitimate on a <button>. */}
          <button
            type="button"
            {...stylex.props(styles.backdrop)}
            onClick={closePanel}
            tabIndex={-1}
            aria-hidden="true"
          />
          <div
            id="admin-menu-panel"
            ref={panelRef}
            {...stylex.props(styles.panel)}
            role="dialog"
            aria-modal="true"
            aria-label="Valikko"
          >
            <div {...stylex.props(styles.panelHeader)}>
              <span {...stylex.props(styles.panelTitle)}>Valikko</span>
              <button
                ref={closeRef}
                type="button"
                {...stylex.props(styles.close)}
                onClick={() => {
                  closePanel();
                  toggleRef.current?.focus();
                }}
                aria-label="Sulje valikko"
              >
                <CloseIcon />
              </button>
            </div>
            <ul {...stylex.props(styles.panelList)}>
              {items.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    // Following a link to the page already open changes no
                    // address, so closing cannot be left to the pathname alone.
                    onClick={closePanel}
                    className={({ isActive }) =>
                      stylex.props(styles.panelLink, isActive && styles.panelLinkActive).className ?? ''
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div {...stylex.props(styles.panelFooter)}>{logoutButton}</div>
          </div>
        </>
      )}
      {/* The address changing means the panel has served its purpose -- this
          catches the browser's back button, which no click handler sees. */}
      <PanelCloserOnNavigation pathname={pathname} onNavigate={closePanel} />
    </>
  );
}

/**
 * Closes the panel whenever the address changes.
 *
 * A tiny component of its own rather than an effect in `AdminMenu`, so the
 * "close on navigation" rule is one readable thing and does not need a guard
 * against firing on the first render.
 */
function PanelCloserOnNavigation({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }): null {
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname;
      onNavigate();
    }
  }, [pathname, onNavigate]);

  return null;
}

const slideIn = stylex.keyframes({
  from: { transform: 'translateX(100%)' },
  to: { transform: 'translateX(0)' },
});

const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

// StyleX has no descendant selectors, so hover/active styling is applied to the
// links themselves rather than through the surrounding <nav>.
const styles = stylex.create({
  nav: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: { default: 'flex-end', [`@media ${DESKTOP}`]: 'flex-start' },
    gap: space.sm,
    padding: `${space.sm} ${space.md}`,
    backgroundColor: color.surfaceMuted,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: color.border,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  list: {
    display: { default: 'none', [`@media ${DESKTOP}`]: 'flex' },
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
  desktopActions: {
    display: { default: 'none', [`@media ${DESKTOP}`]: 'block' },
    marginLeft: 'auto',
  },
  toggle: {
    display: { default: 'flex', [`@media ${DESKTOP}`]: 'none' },
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    padding: 0,
    color: color.textPrimary,
    backgroundColor: { default: 'transparent', ':hover': color.surface },
    borderStyle: 'none',
    borderRadius: radius.sm,
    cursor: 'pointer',
  },
  badge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    color: color.onAccent,
    backgroundColor: color.danger,
    borderRadius: '9px',
    fontSize: '0.6875rem',
    fontWeight: 700,
    lineHeight: '18px',
    textAlign: 'center',
  },
  backdrop: {
    display: { default: 'block', [`@media ${DESKTOP}`]: 'none' },
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    padding: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderStyle: 'none',
    cursor: 'pointer',
    animationName: fadeIn,
    animationDuration: '0.2s',
    zIndex: 998,
  },
  panel: {
    display: { default: 'flex', [`@media ${DESKTOP}`]: 'none' },
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '80%',
    maxWidth: '320px',
    backgroundColor: color.surface,
    boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
    overflowY: 'auto',
    animationName: slideIn,
    animationDuration: '0.25s',
    zIndex: 999,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${space.sm} ${space.md}`,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: color.border,
  },
  panelTitle: {
    color: color.textPrimary,
    fontSize: '1.125rem',
    fontWeight: 700,
  },
  close: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    padding: 0,
    color: color.textPrimary,
    backgroundColor: { default: 'transparent', ':hover': color.surfaceMuted },
    borderStyle: 'none',
    borderRadius: radius.sm,
    cursor: 'pointer',
  },
  panelList: {
    margin: 0,
    padding: `${space.sm} 0`,
    listStyle: 'none',
  },
  panelLink: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '44px',
    padding: `${space.sm} ${space.md}`,
    color: { default: color.textSecondary, ':hover': color.accent },
    backgroundColor: { default: 'transparent', ':hover': color.surfaceMuted },
    fontSize: '1rem',
    textDecoration: 'none',
  },
  panelLinkActive: {
    color: color.accent,
    backgroundColor: color.surfaceMuted,
    fontWeight: 600,
    boxShadow: `inset 3px 0 0 0 currentColor`,
  },
  panelFooter: {
    marginTop: 'auto',
    padding: space.md,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: color.border,
  },
});
