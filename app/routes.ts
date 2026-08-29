import { type RouteConfig } from '@react-router/dev/routes';
import { flatRoutes } from '@react-router/fs-routes';

// Preserve the flat-route file naming convention used under Remix
// (e.g. `bin.full.$courseSlug.tsx`, `notify.$courseSlug.tsx`).
//
// Several shared components/helpers live under app/routes/ for historical
// reasons but are NOT routes. React Router 7 wraps every route module's default
// export with route props (UNSAFE_withComponentProps), which discards props
// passed when they are imported directly as components (e.g. `<DiscSelector
// discNames={...} />`). Exclude them from route generation so they stay plain
// components. (Under Remix's classic compiler these were harmless phantom
// routes; RR7's component-props wrapper makes the exclusion necessary.)
export default flatRoutes({
  ignoredRouteFiles: [
    '**/.*',
    '**/AdminMenu.tsx',
    '**/DiscSelector.tsx',
    '**/DiscTable.tsx',
    '**/discs.syncItem.tsx',
    '**/Header.tsx',
    '**/utils.ts',
    '**/components/**',

    // Disabled rather than deleted: discs are added through /discs/add now, so
    // the Google Sheet sync is no longer used. Excluding the route file makes
    // /discs/sync a 404 while discs.sync.tsx, discs.syncItem.tsx and
    // models/syncDiscs.server.ts stay in place. Delete the line to bring it
    // back.
    '**/discs.sync.tsx',
  ],
}) satisfies RouteConfig;
