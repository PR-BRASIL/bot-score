/* eslint-disable @typescript-eslint/no-unused-vars */
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import { logger } from "../../utils/logger";

interface Patent {
  text: string;
  score: number;
}

/* eslint-disable @typescript-eslint/no-magic-numbers */
export const getPatent = async (score: number) => {
  const collection = await mongoHelper.getCollection("config");
  const patents = await collection.find<Patent>({}).toArray();
  const patentIndex = patents.findIndex((p) => p.score > score) - 1;

  const patent = patents.sort((a, b) => a.score - b.score)[patentIndex];

  if (!patent) return patents[patents.length - 1].text;

  return patent.text;
};
