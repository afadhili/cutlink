export function expiryValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value
    ? new Date(value).toISOString()
    : undefined;
}
