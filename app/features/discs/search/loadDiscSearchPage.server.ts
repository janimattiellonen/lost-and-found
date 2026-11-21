import { redirect } from 'react-router';

import { currentClubId } from '~/config/clubs';
import { getDiscCourseNames } from '~/config/courses';
import { MAX_RESULTS, readDiscSearch, type DiscSearch } from '~/features/discs/search/discSearch';
import { queryDiscSearch, type FoundDisc } from '~/features/discs/search/queryDiscSearch.server';
import { createSupabaseServerClient, isUserLoggedIn } from '~/models/utils';

export type DiscSearchPageData = {
  /** What was searched, for the fields to come back filled in with; null for nothing. */
  search: DiscSearch | null;
  /** Null when nothing was searched — distinct from [], searched and nothing found. */
  results: FoundDisc[] | null;
  /** More discs matched than the page shows. */
  truncated: boolean;
  /** Whether this club files discs under courses, and so has a "Rata" column. */
  showCourse: boolean;
};

/**
 * The search page: the search in the address, and the discs it finds.
 *
 * Admin-only, checked before anything is read, because every row carries an
 * owner's whole phone number. An address with too little to search with runs
 * no query, the same rule the page applies before it asks.
 */
export async function loadDiscSearchPage(request: Request): Promise<DiscSearchPageData> {
  if (!(await isUserLoggedIn(request))) {
    throw redirect('/sign-in');
  }

  const clubId = currentClubId();
  const showCourse = getDiscCourseNames(clubId).length > 0;
  const params = new URL(request.url).searchParams;
  const search = readDiscSearch({ phone: params.get('phone'), disc: params.get('disc') });

  if (search === null) {
    return { search: null, results: null, truncated: false, showCourse };
  }

  // Already a field-by-field projection: queryDiscSearch reads only the columns
  // the table shows, and maps them one by one.
  const found = await queryDiscSearch(createSupabaseServerClient(request), { clubId, search });

  return {
    search,
    results: found.slice(0, MAX_RESULTS),
    truncated: found.length > MAX_RESULTS,
    showCourse,
  };
}
