import styled from '@emotion/styled';

import { Link } from '@remix-run/react';

const Li = styled.li`
  display: inline;
  margin-right: 1rem;

  & a:hover {
    text-decoration: underline;
  }
`;

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
        <Li>Kirjautuneena: {user?.email}</Li>
        <Li>
          <Link to="/">Kiekot</Link>
        </Li>
        <Li>
          <Link to="/discs/sync">Päivitä kiekkodata</Link>
        </Li>
        <Li>
          <Link to="/emptying-log">Tyhjennysloki</Link>
        </Li>
        <Li>
          <Link to="/message-templates">Viestipohjat</Link>
        </Li>
        <Li>
          <Link to="/stats">Statistiikka</Link>
        </Li>
        <Li>
          <Link to={''} onClick={handleLogout}>
            Kirjaudu ulos
          </Link>
        </Li>
      </ul>
    </div>
  );
}
