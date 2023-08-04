import supabaseToken from "~/cookie";

import{createConnection} from "~/models/utils";


export const signInUser = async ({
                                   email,
                                   password,
                                 }) => {
  const supabase = createConnection();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });
  return { data, error };
};



const getToken = async (request) => {
  const cookieHeader =
    request.headers.get("Cookie");
  return await supabaseToken.parse(cookieHeader);
};

const getUserByToken = async (token:any) => {
  const supabase = createConnection();

  supabase.auth.setAuth(token);
  const { user, error } =
    await supabase.auth.api.getUser(token);
  return { user, error };
};

export const isAuthenticated = async (
  request: any,
  validateAndReturnUser = false
) => {
  const token = await getToken(request);
  if (!token && !validateAndReturnUser)
    return false;
  if (validateAndReturnUser) {
    const { user, error } = await getUserByToken(
      token
    );
    if (error) {
      return false;
    }
    return { user };
  }
  return true;
};

export const getUserData = async (userId: any) => {
  const supabase = createConnection();

  const { data, error } = await supabase
    .from("profiles")
    .select()
    .eq("id", userId)
    .single();
  return { data, error };
};
