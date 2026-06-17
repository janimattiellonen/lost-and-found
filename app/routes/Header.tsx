import * as stylex from '@stylexjs/stylex';

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

function getClubLogo(clubId: number): string | undefined {
  if (clubId === 2) {
    return '/tt-sini-logo.jpg';
  }

  return undefined;
}

export default function Header({ clubId, clubName }: HeaderProps): JSX.Element {
  const logo = stylex.props(styles.logo);
  return (
    <div className="flex items-center">
      <img className={`mr-4 ${logo.className ?? ''}`} style={logo.style} src={getClubLogo(clubId)} alt={''} />
      <h1 {...stylex.props(styles.h1)}>Löytökiekot - {clubName}</h1>
    </div>
  );
}
