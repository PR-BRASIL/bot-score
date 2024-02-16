/* eslint-disable @typescript-eslint/no-unused-vars */
import { mongoHelper } from "../infra/db/mongodb/helpers/mongo-helper";

interface Patent {
  text: string;
  score: number;
}

/* eslint-disable @typescript-eslint/no-magic-numbers */
export const getPatent = async (score: number) => {
  const collection = await mongoHelper.getCollection("patents");
  const patents = await collection.find<Patent>({}).toArray();
  const patentsWithSort = patents.sort((a, b) => a.score - b.score);
  const patentIndex = patentsWithSort.findIndex((p) => p.score > score) - 1;

  if (!patentsWithSort) return patents[patents.length - 1].text;

  return patentsWithSort[patentIndex].text;
};
