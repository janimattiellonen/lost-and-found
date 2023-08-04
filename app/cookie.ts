import { createCookie } from "@remix-run/node";
const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 604_800,
};
const supabaseToken = createCookie("sb:token", {
  ...cookieOptions,
});
export default supabaseToken;
