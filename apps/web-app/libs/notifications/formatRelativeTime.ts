/**
 * Formats an ISO date string as a relative time string in Portuguese.
 * e.g. "há 5 minutos", "há 2 horas", "há 3 dias"
 */
export function formatRelativeTime(isoDate: string): string {
  const nowDate = new Date();
  const thenDate = new Date(isoDate);
  const diffMs = nowDate.getTime() - thenDate.getTime();

  if (diffMs < 0) return "agora";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "agora";
  if (minutes < 60) return `há ${minutes} minuto${minutes !== 1 ? "s" : ""}`;
  if (hours < 24) return `há ${hours} hora${hours !== 1 ? "s" : ""}`;
  if (days < 30) return `há ${days} dia${days !== 1 ? "s" : ""}`;

  const months =
    (nowDate.getFullYear() - thenDate.getFullYear()) * 12 +
    (nowDate.getMonth() - thenDate.getMonth());

  if (months < 12) return `há ${months} ${months !== 1 ? "meses" : "mês"}`;

  const years = Math.floor(months / 12);
  return `há ${years} ano${years !== 1 ? "s" : ""}`;
}
