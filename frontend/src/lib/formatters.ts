export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(value);
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}dk`;
  return `${hours}sa ${mins}dk`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatWeight = (grams: number) => {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)}kg`;
  return `${grams.toFixed(0)}g`;
};
