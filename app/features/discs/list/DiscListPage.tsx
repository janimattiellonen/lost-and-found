import { useEffect, useMemo, useState, type JSX } from 'react';
import { useFetcher } from 'react-router';
import debounce from 'lodash.debounce';

import H2 from '~/ui/H2';
import Button from '~/ui/Button';
import Collapse from '~/ui/Collapse';
import Paper from '~/ui/Paper';
import InfoBox from '~/ui/InfoBox';
import EmptyingLogItem from '~/ui/EmptyingLogItem';
import CircularProgress from '~/ui/CircularProgress';

import DiscTable from '~/features/discs/list/DiscTable';
import type { DiscDTO, EmptyingLogDTO } from '~/types';
import DiscSelector from '~/features/discs/list/DiscSelector';
import DiscListIntro from '~/features/discs/list/DiscListIntro';
import CourseFilter from '~/features/discs/list/CourseFilter';
import NumberSearch from '~/ui/NumberSearch';
import { getDiscCourseNames } from '~/config/courses';

export default function DiscListPage(): JSX.Element {
  const fetcher = useFetcher();

  const [isInfoBoxVisible, showInfoBox] = useState<boolean>(false);
  const [discTerm, setDiscTerm] = useState<string | null>('');
  const [phoneNumberTerm, setPhoneNumberTerm] = useState<string | null>('');
  const [courseTerm, setCourseTerm] = useState<string | null>(null);

  // Read straight off the fetcher rather than copied into state by an effect:
  // the copy bought nothing and cost a second render on every load.
  const clubId: number | null = fetcher.data?.clubId ?? null;
  const distinctDiscNames: string[] = fetcher.data?.distinctDiscNames ?? [];
  const distinctCourses: string[] = fetcher.data?.distinctCourses ?? [];
  const emptyingLogItems: EmptyingLogDTO[] = fetcher.data?.emptyingLogItems ?? [];

  const changeHandler = (e: any): void => {
    if (e.target.value.length > 2) {
      setPhoneNumberTerm(e.target.value);
    } else {
      setPhoneNumberTerm(null);
    }
  };

  const debouncedHandler = useMemo(() => {
    return debounce(changeHandler, 300);
  }, []);

  // Derived rather than kept in state: a reload after a delete then cannot lose
  // the filters the way a separate copy of the list would.
  const discs = useMemo<DiscDTO[]>(() => {
    let filtered: DiscDTO[] = fetcher.data?.data ?? [];

    if (discTerm) {
      filtered = filtered.filter((disc: DiscDTO) => disc.discName === discTerm);
    }

    if (phoneNumberTerm) {
      filtered = filtered.filter((disc: DiscDTO) => disc.ownerPhoneNumber?.endsWith(phoneNumberTerm));
    }

    if (courseTerm) {
      filtered = filtered.filter((disc: DiscDTO) => disc.course === courseTerm);
    }

    return filtered;
  }, [fetcher.data, discTerm, phoneNumberTerm, courseTerm]);

  useEffect(() => {
    fetcher.load('/discs/data');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only Puskasoturit collects from more than one course. Talin Tallaajat
  // records no course at all, so neither the filter nor the column applies.
  // Derived rather than a club id in a literal: the filter, the column and the
  // add form then agree by construction, all reading the one course list.
  const clubCourses = clubId === null ? [] : getDiscCourseNames(clubId);
  const isMultiCourseClub = clubCourses.length > 0;

  const hasDiscs = discs.length > 0;
  // A reload keeps the previous fetcher.data, so "loading with data already on
  // screen" is what separates a refresh from the very first load.
  const isReloading = fetcher.state !== 'idle' && fetcher.data != null;
  const isFirstLoad = fetcher.state !== 'idle' && fetcher.data == null;

  return (
    <div>
      <DiscListIntro clubId={clubId} />
      <div className="mt-8">
        {emptyingLogItems.length > 0 && (
          <div>
            <H2 className="mb-4">Löytökiekot tarkistettu viimeksi</H2>
            {emptyingLogItems.map((item: EmptyingLogDTO) => {
              return (
                <div key={item.id}>
                  <EmptyingLogItem item={item} showCourseName={emptyingLogItems.length > 1} />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-8">
        {/* Stacked on a phone: side by side the fields were squeezed to a few
            characters wide. From `sm` up they sit in a row that wraps. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <DiscSelector
            discNames={distinctDiscNames}
            onChange={(selectedItem: string | null) => {
              setDiscTerm(selectedItem);
            }}
          />

          <NumberSearch onChange={debouncedHandler} />

          {/* Nothing to choose between until the loaded discs name more than
              one course. */}
          {isMultiCourseClub && distinctCourses.length > 1 && (
            <CourseFilter courses={distinctCourses} onChange={setCourseTerm} />
          )}

          <Button
            variant="contained"
            type="submit"
            className="h-10 self-start sm:self-auto"
            onClick={() => showInfoBox(!isInfoBoxVisible)}
          >
            Ohjeet
          </Button>
        </div>

        <div className="mt-4 mb-4">
          {
            <Collapse in={isInfoBoxVisible}>
              <Paper elevation={3}>
                <InfoBox clubId={clubId} onClose={() => showInfoBox(false)} />
              </Paper>
            </Collapse>
          }
        </div>
        {/* The table stays mounted while the list is reloading after a delete
            or a mark: unmounting it looked like a page reload, and it threw
            away the sort order, which lives inside DiscTable. The spinner is
            for the first load only, when there is nothing to show yet. */}
        {hasDiscs && (
          <div aria-busy={isReloading} className={isReloading ? 'opacity-50 transition-opacity' : undefined}>
            <DiscTable discs={discs} courses={clubCourses} onChanged={() => fetcher.load('/discs/data')} />
          </div>
        )}
        {isFirstLoad && <CircularProgress style={{ width: '5rem', height: '5rem' }} />}
      </div>
    </div>
  );
}
