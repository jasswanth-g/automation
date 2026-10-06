import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class LocalJSONStore<T extends { id?: string | undefined; created_at?: string | undefined; updated_at?: string | undefined }> {
  private filePath: string;

  constructor(filename: string) {
    this.filePath = path.join(DATA_DIR, `${filename}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  private readData(): T[] {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch {
      return [];
    }
  }

  private writeData(data: T[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async create(item: Partial<T>): Promise<T> {
    const items = this.readData();
    const now = new Date().toISOString();
    const newItem = {
      id: item.id || crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      ...item,
    } as T;
    items.unshift(newItem);
    this.writeData(items);
    return newItem;
  }

  async findAll(): Promise<T[]> {
    return this.readData();
  }

  async findById(id: string): Promise<T | null> {
    const items = this.readData();
    return items.find(item => item.id === id) || null;
  }

  async findByField(field: keyof T, value: any): Promise<T[]> {
    const items = this.readData();
    return items.filter(item => item[field] === value);
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const items = this.readData();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
      return this.create({ id, ...updates });
    }
    
    const updatedItem = {
      ...items[index],
      ...updates,
      updated_at: new Date().toISOString()
    } as T;
    
    items[index] = updatedItem;
    this.writeData(items);
    return updatedItem;
  }

  async delete(id: string): Promise<void> {
    const items = this.readData();
    const filtered = items.filter(item => item.id !== id);
    this.writeData(filtered);
  }
}
