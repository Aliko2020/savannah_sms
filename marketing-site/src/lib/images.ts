// Placeholder photography via Lorem Picsum (real, licensed stock photos served
// by a placeholder CDN — not claimed to depict actual Edusavannah staff,
// students, or institutions). Swap these for real photography before launch.
export function stockPhoto(seed: string, width: number, height: number): string {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
