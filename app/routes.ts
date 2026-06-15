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
  ],
}) satisfies RouteConfig;
