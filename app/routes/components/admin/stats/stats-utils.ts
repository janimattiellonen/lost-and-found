import { DiscDTO } from '~/types';
import { BarValueType } from '~/routes/components/admin/BarChart';
import { getMonthName } from '~/routes/utils';
import { format, isWithinInterval, lastDayOfMonth } from 'date-fns';

export type LostDiscsProps = {
  data: DiscDTO[];
};

export type AddedDiscCountByMonthType = {
  dataTopic: number;
  amount: number;
  date?: Date;
};

export const mapBarData = (data: AddedDiscCountByMonthType[]): BarValueType[] => {
  return data.map((item) => {
    return {
      label: '',
      value: item.amount,
      date: item.date,
    };
  });
};

export const getLegendItems = (data: AddedDiscCountByMonthType[]): string[] => {
  return data.map((item) => getMonthName(item.date));
};

export const getLegendItems2 = (data: AddedDiscCountByMonthType[]): string[] => {
  return data.map((item) => (item.date ? format(item.date, 'dd') : ''));
};

export function mapBySeparator(
  data: DiscDTO[],
  getSeparator: (date: Date) => number,
): { [key: number]: { value: number; date?: Date } } {
  const mapped: { [key: number]: { value: number; date?: Date } } = {};

  data.map((item: DiscDTO) => {
    if (!item.addedAt) {
      return null;
    }

    const date = new Date(item.addedAt);
    const separator = getSeparator(date);
    const prevValue: number = mapped[separator] ? mapped[separator].value : 0;

    if (!mapped[separator]) {
      mapped[separator] = { value: 0, date };
    }

    mapped[separator].value = prevValue + 1;
  });

  return mapped;
}

export function sortMappedData(mapped: { [key: number]: { value: number; date?: Date } }): AddedDiscCountByMonthType[] {
  const keys = Object.keys(mapped);

  const res: AddedDiscCountByMonthType[] = keys.map((key) => {
    return {
      dataTopic: parseInt(key, 10) + 1,
      amount: mapped[parseInt(key, 10)].value,
      date: mapped[parseInt(key, 10)].date,
    };
  });

  return res.sort((a, b) => {
    if (!b.date || !a.date) {
      return 0;
    }

    if (b.date > a.date) {
      return -1;
    }

    if (b.date < a.date) {
      return 1;
    }

    return 0;
  });
}

export function getAddedDiscCountByMonth(
  data: DiscDTO[],
  getSeparator: (date: Date) => number,
): AddedDiscCountByMonthType[] {
  const mapped = mapBySeparator(data, getSeparator);

  return sortMappedData(mapped);
}

export function getAddedDiscCountByDaysInMonth(
  date: Date,
  data: DiscDTO[],
  getSeparator: (date: Date) => number,
): AddedDiscCountByMonthType[] {
  const firstDay: Date | null = date ? new Date(format(date, 'yyyy-MM-01')) : null;
  const lastDay: Date | null = date ? lastDayOfMonth(date) : null;

  const filtered = data.filter((item) => {
    if (firstDay === null || lastDay === null) {
      return false;
    }

    return item.addedAt && isWithinInterval(new Date(item.addedAt), { start: firstDay, end: lastDay });
  });

  const mapped = mapBySeparator(filtered, getSeparator);

  return sortMappedData(mapped);
}

export function getDonatedOrSoldDiscCount(data: DiscDTO[]): number {
  return data.filter((item) => item.canBeSoldOrDonated).length;
}

export function getReturnedDiscCount(data: DiscDTO[]): number {
  return data.filter((item) => item.isReturnedToOwner).length;
}
