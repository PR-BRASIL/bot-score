/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { Patent } from "../domain/models/patent";
import { mongoHelper } from "../infra/db/mongodb/helpers/mongo-helper";

export class GetPatentProgress {
  public async get(score: number) {
    const collection = await mongoHelper.getCollection("patents");
    const patents = await collection.find<Patent>({}).toArray();

    const patentWithSort = patents.sort((a, b) => a.score - b.score);
    const patentIndex = patentWithSort.findIndex((p) => p.score > score);

    const REPEAT = 13;
    if (!patentWithSort[patentIndex - 1])
      return "[" + "▰".repeat(REPEAT) + "] (Max Level)";

    const nextScore = !patentWithSort
      ? patents[patents.length - 1].score
      : patentWithSort[patentIndex].score;

    const actualPatenScore = patentWithSort[patentIndex - 1].score;

    // Obter o texto da próxima patente para extrair o ícone
    const nextPatentText = patentWithSort[patentIndex].text;

    return this.getProgressBar(
      score - actualPatenScore,
      nextScore - actualPatenScore,
      REPEAT,
      nextPatentText
    );
  }

  public getProgressBar(
    currentValue: number,
    desiredValue: number,
    barSize: number,
    nextPatentText?: string
  ): string {
    if (currentValue < 0 || currentValue > desiredValue) {
      throw new Error("Invalid current value");
    }

    if (barSize <= 0) {
      throw new Error("Invalid bar size");
    }

    const percentageComplete = (currentValue / desiredValue) * 100;

    const filledCharacters = Math.floor((percentageComplete / 100) * barSize);

    let progressBar = "**Proximo nível:** [";
    for (let i = 0; i < barSize; i++) {
      if (i < filledCharacters) {
        progressBar += "▰";
      } else {
        progressBar += "▱";
      }
    }

    // Adicionar o ícone da próxima patente se disponível
    if (nextPatentText) {
      const patentParts = nextPatentText.split(" <");
      const icon = patentParts.length > 1 ? `<${patentParts[1]}` : "";
      progressBar += `] **(${currentValue}/${desiredValue} ${icon})** `;
    } else {
      progressBar += `] (${currentValue}/${desiredValue})`;
    }

    return progressBar;
  }
}
