import { DiscDTO } from "~/types";

export function getDistinctDiscNames(discs: DiscDTO[]): string[] {
  const set = new Set<string>();

  const unique: string[] = [];

  discs.map((disc: DiscDTO) => {
    if (!set.has(disc?.discName?.toLowerCase())) {
      set.add(disc?.discName?.toLowerCase());
      unique.push(disc?.discName);
    }
  });

  return unique;
}

type GroupedType = {
  [index: string]: string[];
};

export function groupByInitialCharacter(data: string[]) {
  const values: GroupedType = {};

  data.map((item: string) => {
    const firstChar = item.slice(0, 1);
    const items = values[firstChar] ? values[firstChar] : [];
    values[firstChar] = [...items, item];
  });

  return values;
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return "";
  }

  const formattedDate = new Intl.DateTimeFormat("fi-FI").format(
    new Date(dateStr)
  );

  return formattedDate;
}
