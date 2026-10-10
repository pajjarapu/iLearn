const held = new Map<string, string>();

export const burners = {
  claim(file: string, ticketId: string): boolean {
    const owner = held.get(file);
    if (owner && owner !== ticketId) return false;
    held.set(file, ticketId);
    return true;
  },

  release(file: string, ticketId: string): void {
    if (held.get(file) === ticketId) held.delete(file);
  },

  holder(file: string): string | null {
    return held.get(file) ?? null;
  },

  clear(): void {
    held.clear();
  },
};
