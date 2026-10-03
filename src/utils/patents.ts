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
  if (!patents.length) {
    return "Sem patente";
  }

  const patentsWithSort = patents.sort((a, b) => a.score - b.score);
  const nextPatentIndex = patentsWithSort.findIndex((p) => p.score > score);

  // Score acima de todas as patentes → patente máxima
  if (nextPatentIndex === -1) {
    return patentsWithSort[patentsWithSort.length - 1].text;
  }

  // Score abaixo da primeira patente → patente mínima
  if (nextPatentIndex === 0) {
    return patentsWithSort[0].text;
  }

  return patentsWithSort[nextPatentIndex - 1].text;
};
