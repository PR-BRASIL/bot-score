/* eslint-disable @typescript-eslint/no-unused-vars */
import { mongoHelper } from "../../infra/db/mongodb/helpers/mongo-helper";
import { logger } from "../../utils/logger";

/* eslint-disable @typescript-eslint/no-magic-numbers */
export const getPatent = async (score: number) => {
  try {
    interface Patent {
      text: string;
      score: number;
    }
    const collection = await mongoHelper.getCollection("config");
    const patents: Patent = (await collection.find<any>({}).toArray())[0];

    const sortedPatents = Object.entries(patents)
      .filter(([, patent]) => patent.score !== undefined)
      .sort((a, b) => b[1].score - a[1].score);

    for (const [field, patent] of sortedPatents) {
      if (score > patent.score) return patent.text;
    }
  } catch (error) {
    logger.error("Error fetching patents:", error);
  }
};
