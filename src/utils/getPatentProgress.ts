/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { Patent } from "../domain/models/patent";
import { mongoHelper } from "../infra/db/mongodb/helpers/mongo-helper";

export class GetPatentProgress {
  public async get(score: number) {
    const collection = await mongoHelper.getCollection("patents");
    const patents = await collection.find<Patent>({}).toArray();
    const patentIndex = patents.findIndex((p) => p.score > score);

    const patent = patents.sort((a, b) => a.score - b.score);

    const REPEAT = 20;
    if (!patent[patentIndex - 1])
      return "[" + "▋".repeat(REPEAT) + "] (Max Level)";

    const nextScore = !patent
      ? patents[patents.length - 1].score
      : patent[patentIndex].score;

    const actualPatenScore = patent[patentIndex - 1].score;

    return this.getProgressBar(
      score - actualPatenScore,
      nextScore - actualPatenScore,
      REPEAT
    );
  }

  public getProgressBar(
    currentValue: number,
    desiredValue: number,
    barSize: number
  ): string {
    if (currentValue < 0 || currentValue > desiredValue) {
      throw new Error("Invalid current value");
    }

    if (barSize <= 0) {
      throw new Error("Invalid bar size");
    }

    const percentageComplete = (currentValue / desiredValue) * 100;

    const filledCharacters = Math.floor((percentageComplete / 100) * barSize);

    let progressBar = "Next level: [";
    for (let i = 0; i < barSize; i++) {
      if (i < filledCharacters) {
        progressBar += "▋";
      } else {
        progressBar += "░";
      }
    }
    progressBar += `] (${currentValue}/${desiredValue})`;

    return progressBar;
  }
}
