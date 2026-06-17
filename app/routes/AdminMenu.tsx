import * as stylex from '@stylexjs/stylex';

import { Link } from 'react-router';

import { space } from '~/styles/tokens.stylex';

// StyleX has no descendant selectors, so the former `& a:hover { underline }`
// is applied to the links directly.
const styles = stylex.create({
  item: {
    display: 'inline',
    marginRight: space.md,
  },
  link: {
    textDecoration: { ':hover': 'underline' },
  },
});

export default function AdminMenu({ supabase, user }: any): JSX.Element | null {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (user?.email == null) {
    return null;
  }

  return (
    <div>
      <ul>
        <li {...stylex.props(styles.item)}>Kirjautuneena: {user?.email}</li>
        <li {...stylex.props(styles.item)}>
          <Link to="/" {...stylex.props(styles.link)}>
            Kiekot
          </Link>
        </li>
        <li {...stylex.props(styles.item)}>
          <Link to="/discs/sync" {...stylex.props(styles.link)}>
            Päivitä kiekkodata
          </Link>
        </li>
        <li {...stylex.props(styles.item)}>
          <Link to="/emptying-log" {...stylex.props(styles.link)}>
            Tyhjennysloki
          </Link>
        </li>
        <li {...stylex.props(styles.item)}>
          <Link to="/message-templates" {...stylex.props(styles.link)}>
            Viestipohjat
          </Link>
        </li>
        <li {...stylex.props(styles.item)}>
          <Link to="/stats" {...stylex.props(styles.link)}>
            Statistiikka
          </Link>
        </li>
        <li {...stylex.props(styles.item)}>
          <Link to="/notifications" {...stylex.props(styles.link)}>
            Ilmoitukset
          </Link>
        </li>
        <li {...stylex.props(styles.item)}>
          <Link to={''} onClick={handleLogout} {...stylex.props(styles.link)}>
            Kirjaudu ulos
          </Link>
        </li>
      </ul>
    </div>
  );
}
