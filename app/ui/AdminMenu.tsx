import * as stylex from '@stylexjs/stylex';

import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';

import Button from '~/ui/Button';
import { CloseIcon, MenuIcon } from '~/ui/icons';
import { color, radius, space } from '~/styles/tokens.stylex';

import type { SupabaseClient, User } from '@supabase/supabase-js';
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
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

// What the Tab key can reach inside the panel: its links, and its two buttons.
// That is everything the panel contains; widen this if it ever grows a field.
const FOCUSABLE = 'a[href], button:not([disabled])';

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
  supabase: SupabaseClient;
  user: User | null | undefined;
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
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  const shownPathname = useRef(pathname);

  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  // What the panel does to the rest of the page while it is open. Each piece is
  // set up independently, but they are undone in one place and in one order,
  // because focusing a button that is still inert would silently do nothing.
  useEffect(() => {
    const panel = panelRef.current;

    if (!isPanelOpen || panel == null) {
      return;
    }

    const releaseBackground = makeBackgroundInert(panel, backdropRef.current);
    const releaseScroll = lockScroll();
    const releaseKeyboard = handlePanelKeys(panel, closePanel);

    closeRef.current?.focus();

    const toggle = toggleRef.current;

    return () => {
      releaseKeyboard();
      releaseBackground();
      releaseScroll();

      // Closing anything -- the button, Escape, the backdrop, a navigation --
      // ends here, so focus comes back to the hamburger from every one of them.
      // Focus that has already gone somewhere deliberate is left where it is;
      // only focus dropped on the document is rescued.
      if (document.activeElement == null || document.activeElement === document.body) {
        toggle?.focus();
      }
    };
  }, [isPanelOpen, closePanel]);

  // The panel only exists below the breakpoint. Widening the window past it
  // hides the panel by CSS, so the state has to follow -- otherwise the scroll
  // lock and the inert background would outlive the thing that asked for them.
  //
  // This is the one close path that returns focus nowhere: at that width the
  // hamburger is `display: none`, so focusing it does nothing and focus stays on
  // the document. See the spec's known gaps.
  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    const desktop = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const onChange = () => desktop.matches && closePanel();

    desktop.addEventListener('change', onChange);

    return () => desktop.removeEventListener('change', onChange);
  }, [isPanelOpen, closePanel]);

  // The address changing means the panel has served its purpose. This is what
  // catches the browser's back button, which no click handler sees.
  useEffect(() => {
    if (shownPathname.current === pathname) {
      return;
    }

    shownPathname.current = pathname;
    closePanel();
  }, [pathname, closePanel]);

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
          {items.map((item) => (
            <MenuNavLink key={item.to} {...item} variant="bar" />
          ))}
        </ul>
        <div {...stylex.props(styles.desktopActions)}>{logoutButton}</div>
        <button
          ref={toggleRef}
          type="button"
          {...stylex.props(styles.iconButton, styles.toggle)}
          onClick={() => setIsPanelOpen(true)}
          aria-label={pending > 0 ? `Avaa valikko, ${pending} odottaa käsittelyä` : 'Avaa valikko'}
          aria-expanded={isPanelOpen}
          // Only while the panel is in the page: the panel is mounted on
          // opening, and a reference to an id that does not exist is worse than
          // no reference at all.
          aria-controls={isPanelOpen ? PANEL_ID : undefined}
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
          {/* Closing by tapping outside is a pointer convenience; the keyboard
              has Escape and the close button. role="presentation" says as much,
              and keeps the backdrop out of the tab order and the accessibility
              tree without a focusable element pretending to be hidden. */}
          <div ref={backdropRef} role="presentation" {...stylex.props(styles.backdrop)} onClick={closePanel} />
          <div
            id={PANEL_ID}
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
                {...stylex.props(styles.iconButton, styles.close)}
                onClick={closePanel}
                aria-label="Sulje valikko"
              >
                <CloseIcon />
              </button>
            </div>
            <ul {...stylex.props(styles.panelList)}>
              {items.map((item) => (
                // Following a link to the page already open changes no address,
                // so closing cannot be left to the pathname alone.
                <MenuNavLink key={item.to} {...item} variant="panel" onClick={closePanel} />
              ))}
            </ul>
            <div {...stylex.props(styles.panelFooter)}>{logoutButton}</div>
          </div>
        </>
      )}
    </>
  );
}

/**
 * Makes everything except the panel unreachable, and gives back the undo.
 *
 * `inert` is what actually does it: no Tab, no click, and no screen-reader
 * cursor either. `aria-modal` alone asks the screen reader nicely; this tells
 * the browser. Anything that contains the panel or its backdrop is left alone,
 * so the two survive being moved deeper into the page some day.
 *
 * The children are looked at once, on opening. See the spec's known gaps.
 */
function makeBackgroundInert(panel: HTMLElement, backdrop: HTMLElement | null): () => void {
  const background = Array.from(document.body.children).filter(
    (element) => !element.contains(panel) && !(backdrop != null && element.contains(backdrop)),
  );

  background.forEach((element) => element.setAttribute('inert', ''));

  return () => background.forEach((element) => element.removeAttribute('inert'));
}

/**
 * Stops the page behind the panel scrolling, and gives back the undo.
 *
 * The undo puts back whatever `overflow` was there before rather than blanking
 * it, so the lock cannot quietly discard someone else's value.
 */
function lockScroll(): () => void {
  const previous = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  return () => {
    document.body.style.overflow = previous;
  };
}

/**
 * Takes over the two keys a dialog owns, and gives back the undo.
 *
 * Tab is kept inside the panel; Escape closes it.
 *
 * Focus that is somehow outside the panel is pulled back into it, not only
 * wrapped around at the two ends.
 */
function handlePanelKeys(panel: HTMLElement, close: () => void): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first == null) {
      return;
    }

    if (!panel.contains(document.activeElement)) {
      first.focus();
      event.preventDefault();
    } else if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  };

  document.addEventListener('keydown', onKeyDown);

  return () => document.removeEventListener('keydown', onKeyDown);
}

const PANEL_ID = 'admin-menu-panel';

type MenuNavLinkProps = MenuLink & {
  /** Which of the two layouts this link is being drawn in. */
  variant: 'bar' | 'panel';
  onClick?: () => void;
};

/**
 * One list item, in the bar or in the panel.
 *
 * The same links appear in both layouts, so they are described once here and
 * the layout only picks the styling. Only the styling differs; a label or a
 * target cannot drift between the two.
 */
function MenuNavLink({ to, label, variant, onClick }: MenuNavLinkProps): JSX.Element {
  const [base, active] =
    variant === 'bar' ? [styles.link, styles.activeLink] : [styles.panelLink, styles.panelLinkActive];

  return (
    <li>
      <NavLink
        to={to}
        end={to === '/'}
        onClick={onClick}
        className={({ isActive }) => stylex.props(base, isActive && active).className ?? ''}
      >
        {label}
      </NavLink>
    </li>
  );
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
    justifyContent: { default: 'flex-end', [`@media ${DESKTOP_MEDIA_QUERY}`]: 'flex-start' },
    gap: space.sm,
    padding: `${space.sm} ${space.md}`,
    backgroundColor: color.surfaceMuted,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: color.border,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  list: {
    display: { default: 'none', [`@media ${DESKTOP_MEDIA_QUERY}`]: 'flex' },
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
    display: { default: 'none', [`@media ${DESKTOP_MEDIA_QUERY}`]: 'block' },
    marginLeft: 'auto',
  },
  // 44 by 44 is the smallest square that is reliably hittable with a thumb, and
  // both of the phone layout's icon buttons want it.
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    padding: 0,
    color: color.textPrimary,
    borderStyle: 'none',
    borderRadius: radius.sm,
    cursor: 'pointer',
  },
  toggle: {
    display: { default: 'flex', [`@media ${DESKTOP_MEDIA_QUERY}`]: 'none' },
    position: 'relative',
    backgroundColor: { default: 'transparent', ':hover': color.surface },
  },
  close: {
    backgroundColor: { default: 'transparent', ':hover': color.surfaceMuted },
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
    display: { default: 'block', [`@media ${DESKTOP_MEDIA_QUERY}`]: 'none' },
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    cursor: 'pointer',
    animationName: fadeIn,
    animationDuration: '0.2s',
    zIndex: 998,
  },
  panel: {
    display: { default: 'flex', [`@media ${DESKTOP_MEDIA_QUERY}`]: 'none' },
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
    boxShadow: 'inset 3px 0 0 0 currentColor',
  },
  panelFooter: {
    marginTop: 'auto',
    padding: space.md,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: color.border,
  },
});
