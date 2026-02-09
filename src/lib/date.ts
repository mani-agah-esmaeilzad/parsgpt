import { differenceInCalendarDays, format } from "date-fns";

const persianFormatter = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function getConversationGroup(date: Date) {
  const diff = differenceInCalendarDays(new Date(), date);
  if (diff === 0) return "today" as const;
  if (diff === 1) return "yesterday" as const;
  if (diff <= 7) return "last7" as const;
  return "older" as const;
}

export function formatDate(date: Date, pattern = "yyyy/MM/dd") {
  try {
    return format(date, pattern);
  } catch {
    return persianFormatter.format(date);
  }
}

export function formatPersian(date: Date) {
  return persianFormatter.format(date);
}
