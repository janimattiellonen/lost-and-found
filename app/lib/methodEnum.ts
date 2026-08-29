/** One choice: the number that is stored, and the Finnish word for it. */
type MethodSpec = Record<string, { value: number; label: string }>;

/**
 * Builds the small enum both disc marks need: named numeric values, the options
 * in the order the form offers them, a guard, and a label lookup.
 *
 * The numbers are persisted as smallints, so add new ones, never renumber the
 * existing ones, and extend the CHECK constraint in the migration alongside
 * them.
 */
export function methodEnum<const T extends MethodSpec>(spec: T) {
  type Value = T[keyof T]['value'];

  const values = Object.fromEntries(Object.entries(spec).map(([name, choice]) => [name, choice.value])) as {
    [K in keyof T]: T[K]['value'];
  };

  const options: { value: Value; label: string }[] = Object.values(spec).map((choice) => ({
    value: choice.value as Value,
    label: choice.label,
  }));

  const known: number[] = options.map((option) => option.value);

  function is(value: unknown): value is Value {
    return typeof value === 'number' && Number.isInteger(value) && known.includes(value);
  }

  function label(value: number | null | undefined): string | null {
    return options.find((option) => option.value === value)?.label ?? null;
  }

  return { values, options, is, label };
}
