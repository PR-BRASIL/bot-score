import type { Collection } from "mongodb";
import { MongoClient } from "mongodb";
import { env } from "../../../../main/config/env";

export const mongoHelper = {
  client: null as MongoClient,
  async connect(url?: string): Promise<void> {
    this.client = await new MongoClient(url || env.mongoUrl).connect();
  },

  async disconnect(): Promise<void> {
    await this.client.close();
    this.client = null;
  },

  dbCollection(): Collection {
    return;
  },

  async getCollection<T = any>(name: string): Promise<Collection<T>> {
    try {
      return this.client.db().collection(name) as Collection<T>;
    } catch {
      await this.connect();
      return this.client.db().collection(name) as Collection<T>;
    }
  },

  // eslint-disable-next-line
  map(account: any): any {
    try {
      const { _id, ...accountWithoudId } = account;

      return {
        ...accountWithoudId,
        id: _id.toString(),
      };
    } catch {
      return null;
    }
  },
};
