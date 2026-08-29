import { type RouteConfig } from '@react-router/dev/routes';
import { flatRoutes } from '@react-router/fs-routes';

// Preserve the flat-route file naming convention used under Remix
// (e.g. `bin.full.$courseSlug.tsx`, `notify.$courseSlug.tsx`).
//
// Every file under app/routes/ is a route. Shared components live in app/ui/
// and feature components in app/features/<domain>/, so nothing has to be
// excluded here -- which also avoids RR7's route-props wrapper
// (UNSAFE_withComponentProps) swallowing props passed to a component that was
// imported directly.
export default flatRoutes({
  ignoredRouteFiles: [
    '**/.*',

    // Disabled rather than deleted: discs are added through /discs/add now, so
    // the Google Sheet sync is no longer used. Excluding the route file makes
    // /discs/sync a 404 while discs.sync.tsx, features/discSync/SyncItem.tsx
    // and models/syncDiscs.server.ts stay in place. Delete the line to bring it
    // back.
    '**/discs.sync.tsx',
  ],
}) satisfies RouteConfig;
