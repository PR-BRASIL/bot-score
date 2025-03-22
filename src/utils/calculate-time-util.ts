export function calculateTotalOnlineTime(time: number): string {
  const days = Math.floor(time / (3600 * 24));
  const hours = Math.floor((time % (3600 * 24)) / 3600);
  const minutes = Math.floor((time % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
}
