import {
  Form,
  useActionData,
  useOutletContext
} from "@remix-run/react";

import {ActionArgs, json} from "@remix-run/node";

import {createServerClient} from "@supabase/auth-helpers-remix";


import {createSupabaseServerClient} from "~/models/utils";

type LoginErrors = {
  password?: string | null | undefined
  email?: string | null | undefined
  invalidLogin?: boolean | null | undefined
}
export async function action({ request }: ActionArgs) {
  const errors: LoginErrors = {};

  const supabase = createSupabaseServerClient(request)

  try {
    const form = await request.formData();
    const email = form.get("email")!;
    const password = form.get("password")!;


    if (
      typeof email !== "string" ||
      email.length === 0
    ) {
      errors.email = "Username is required";
    }


    if (
      typeof password !== "string" ||
      password.length === 0
    ) {
      errors.password = "Password is required";
    }

    const result = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString()
    })

    console.log(`RESULT: ${JSON.stringify(result,null,2)}`)

    if (result?.error) {
      errors.invalidLogin = true;
    }

    if (Object.keys(errors).length) {
      return json(errors, { status: 422 });
    }

    return json({ok: true});
  } catch (error) {
    console.log(`ERROR: ${JSON.stringify(error, null,2)}`)
  }
}
export default function SignInPage(): JSX.Element {
  const errors = useActionData();
  const { supabase } = useOutletContext()

  const handleEmailLogin = async () => {
    await supabase.auth.signInWithPassword({
      email: 'janimatti.ellonen@gmail.com',
      password: 'Kissa_45#&Hoopla',
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return <div>

    <h1>Sign in</h1>

    <p><button onClick={handleEmailLogin}>Email Login</button></p>

    <p>      <button onClick={handleLogout}>Logout</button></p>


    <Form method="post">

      <div className="mb-2">
        <label
          className="text-gray-700 text-sm font-bold mb-2"
          htmlFor="email"
        >
          Email
        </label>
        <input
          id="email"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="email"
          placeholder="Your email"
          name="email"
        />

        {errors?.email ? (
          <p className="text-red-500 text-xs italic">
            {errors.email}
          </p>
        ) : null}
      </div>
      <div className="mb-2">
        <label
          className="text-gray-700 text-sm font-bold mb-2"
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="password"
          name="password"
          placeholder="Your password"
        />

        {errors?.password ? (
          <p className="text-red-500 text-xs italic">
            {errors.password}
          </p>
        ) : null}
      </div>

      <div className="mb-2">
        {errors?.invalidLogin ? (
          <p className="text-red-500 text-xs italic">
            Invalid username or password
          </p>
        ) : null}
      </div>


      <button type="submit">Login</button>
    </Form>
  </div>
}
