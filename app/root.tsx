import {useEffect, useState} from "react";
import { cssBundleHref } from "@remix-run/css-bundle";
import type {LinksFunction, LoaderArgs, V2_MetaFunction} from "@remix-run/node";

import { metaV1 } from "@remix-run/v1-meta";


import { json} from "@remix-run/node";


import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRevalidator,
} from "@remix-run/react";

import{createBrowserClient, createServerClient} from "@supabase/auth-helpers-remix";

import AdminMenu from "~/routes/AdminMenu";
import Header from "~/routes/Header";
import appStyles from "../app.css";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }, { rel: "stylesheet", href: appStyles }] : [{ rel: "stylesheet", href: appStyles }]),
];



export async function loader({request}: LoaderArgs){
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_KEY: process.env.SUPABASE_KEY!,
    CLUB_NAME: process.env.APP_CLUB_NAME!
  }

  const response = new Response()

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    request,
    response,
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return json(
    {
      env,
      session,
    },
    {
      headers: response.headers,
    }
  )
}

export const meta: V2_MetaFunction<typeof loader> = ({data}) => {
  return [
    { title: `Löytökiekot | ${data?.env.CLUB_NAME}` },
    {
      property: "og:title",
      content: "Löytökiekot",
    },
    {
      name: "description",
      content: "Seuran löytökiekot",
    },
  ];
};

export default function App() {
  const { env, session } = useLoaderData()
  const { revalidate } = useRevalidator()
  const [supabase] = useState(() => createBrowserClient(
    env.SUPABASE_URL,
    env.SUPABASE_KEY)
  );

  const serverAccessToken = session?.access_token

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverAccessToken) {
        // server and client are out of sync.
        revalidate()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [serverAccessToken, supabase, revalidate])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AdminMenu supabase={supabase} user={session?.user}/>
        <Header clubName={env.CLUB_NAME}/>
        <Outlet context={{supabase}}/>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
