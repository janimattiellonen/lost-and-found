import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library registers this itself when Vitest runs with `globals: true`.
// This project does not — tests import `describe` and `it` explicitly — so
// without it every render stays in the document and the second `getByRole` in a
// file finds two elements instead of one.
afterEach(cleanup);
