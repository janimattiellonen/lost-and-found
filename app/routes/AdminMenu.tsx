
export default function AdminMenu({supabase, user}: any): JSX.Element | null {

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (user?.email == null) {
    return null;
  }

  return <div>
    <p>{user?.email}</p>
    <p><button onClick={handleLogout}>Logout</button></p>
  </div>



}
