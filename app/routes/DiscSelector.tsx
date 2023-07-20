import { groupByInitialCharacter } from "~/routes/utils";

type DiscSelectorProps = {
  discNames: string[];
  onChange: (e: object) => void;
};
export default function DiscSelector({
  discNames,
  onChange,
}: DiscSelectorProps): JSX.Element {
  return (
    <select onChange={onChange}>
      <option value="-1">Select...</option>
      {discNames &&
        discNames.map((discName: string, index: number) => {
          return (
            <option key={index} value={discName}>
              {discName}
            </option>
          );
        })}
    </select>
  );
}
