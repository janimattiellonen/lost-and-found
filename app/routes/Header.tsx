
type HeaderProps = {
  clubName: string
}
export default function Header({clubName}: HeaderProps): JSX.Element {
  return <h1 className="font-bold text-4xl">Löytökiekot - {clubName}</h1>
}
