import type { Pattern } from '../types';

export class InMemoryPatternStorage {
  private patterns = new Map<string, Pattern>();

  async save(pattern: Pattern): Promise<void> {
    this.patterns.set(pattern.id, pattern);
  }

  async get(id: string): Promise<Pattern | null> {
    return this.patterns.get(id) ?? null;
  }

  async list(): Promise<Pattern[]> {
    return [...this.patterns.values()];
  }

  async delete(id: string): Promise<void> {
    this.patterns.delete(id);
  }
}
