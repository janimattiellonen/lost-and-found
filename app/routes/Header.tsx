import styled from '@emotion/styled';

type HeaderProps = {
  clubId: number;
  clubName: string;
};

const Logo = styled.img`
  font-weight: bold;
  width: 50px;

  @media (min-width: 600px) {
    width: 100px;
  }
`;

const H1 = styled.h1`
  font-size: 1.5rem;

  @media (min-width: 600px) {
    font-size: 2.25rem;
  }
`;

function getClubLogo(clubId: number): string | undefined {
  if (clubId === 1) {
    return '/puskasoturit-logo2.png';
  }
  if (clubId === 2) {
    return '/tt-sini-logo.jpg';
  }

  return undefined;
}
export default function Header({ clubId, clubName }: HeaderProps): JSX.Element {
  return (
    <div className="flex items-center">
      <Logo className="mr-4" src={getClubLogo(clubId)} alt={''} />
      <H1>Löytökiekot - {clubName}</H1>
    </div>
  );
}
