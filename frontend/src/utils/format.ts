// Database values (names, class names, etc.) are stored however the admin
// typed them — often ALL CAPS. Always format for display, never for editing.
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

export function formatName(firstName: string, lastName: string): string {
  return `${titleCase(firstName)} ${titleCase(lastName)}`;
}

export function formatCurrency(amount: number): string {
  return `GHS ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
