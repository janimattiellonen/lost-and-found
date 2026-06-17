import { useEffect, useState } from 'react';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRevalidator,
} from 'react-router';

import { createBrowserClient } from '@supabase/ssr';

import { createSupabaseServerClientWithHeaders } from '~/models/utils';

import AdminMenu from '~/routes/AdminMenu';
import Header from '~/routes/Header';
// Side-effect import so Vite processes app.css through PostCSS/Tailwind in both
// dev and build (a `?url` import is served raw in dev, leaving @tailwind
// directives unexpanded). React Router injects the resulting stylesheet for SSR.
import '../app.css';

export async function loader({ request }: LoaderFunctionArgs) {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_KEY: process.env.SUPABASE_KEY!,
    CLUB_NAME: process.env.APP_CLUB_NAME!,
    CLUB_ID: process.env.APP_CLUB_ID!,
  };

  const { supabase, headers } = createSupabaseServerClientWithHeaders(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return data(
    {
      env,
      session,
    },
    {
      headers,
    },
  );
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `Löytökiekot | ${data?.env.CLUB_NAME}` },
    {
      property: 'og:title',
      content: 'Löytökiekot',
    },
    {
      name: 'description',
      content: 'Seuran löytökiekot',
    },
  ];
};

export default function App() {
  const { env, session } = useLoaderData();
  const { revalidate } = useRevalidator();
  const location = useLocation();
  const [supabase] = useState(() => createBrowserClient(env.SUPABASE_URL, env.SUPABASE_KEY));

  const serverAccessToken = session?.access_token;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverAccessToken) {
        // server and client are out of sync.
        revalidate();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [serverAccessToken, supabase, revalidate]);

  const iconUrl = parseInt(env.CLUB_ID, 10) === 2 ? '/tt-sini-logo-32-32.jpg' : '';
  const isNotifyPage = location.pathname.startsWith('/notify');
  const isLoggedIn = !!session?.user;
  const showHeader = !isNotifyPage || isLoggedIn;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <link rel="shortcut icon" href={iconUrl} />
        <Links />
        {/* StyleX dev CSS endpoint (DEV only). In production the unplugin folds
            StyleX's atomic CSS into the root stylesheet via cssInjectionTarget
            (see vite.config.ts), which <Links/> already serves app-wide. */}
        {import.meta.env.DEV && <link rel="stylesheet" href="/virtual:stylex.css" suppressHydrationWarning />}
      </head>
      <body>
        {showHeader && <AdminMenu supabase={supabase} user={session?.user} />}
        {showHeader && <Header clubId={parseInt(env.CLUB_ID, 10)} clubName={env.CLUB_NAME} />}
        <Outlet context={{ supabase, session }} />
        <ScrollRestoration />
        <Scripts />
        {import.meta.env.DEV && <script type="module" src="/@id/virtual:stylex:runtime" />}
      </body>
    </html>
  );
}
