export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" }).format(
    new Date(iso),
  );
}
