/* eslint-disable @typescript-eslint/no-magic-numbers */
export const getPatent = (score: number) => {
  if (score < 5000) {
    return "Novato";
  } else if (score < 10000) {
    return "Cabo";
  } else if (score < 15000) {
    return "Sargento";
  } else if (score < 20000) {
    return "Terceiro-Sargento 1";
  } else if (score < 25000) {
    return "Terceiro-Sargento 2";
  } else if (score < 30000) {
    return "Terceiro-Sargento 3";
  } else if (score < 35000) {
    return "Segundo-Sargento 1";
  } else if (score < 40000) {
    return "Tenente";
  } else if (score < 45000) {
    return "Capitão";
  } else if (score < 60000) {
    return "Major";
  } else if (score < 70000) {
    return "Tenente-Coronel 1";
  } else if (score < 75000) {
    return "Tenente-Coronel 2";
  } else if (score < 80000) {
    return "Tenente-Coronel 3";
  } else if (score < 95000) {
    return "Tenente-Coronel 4";
  } else if (score < 100000) {
    return "Coronel";
  } else if (score < 105000) {
    return "Lendário";
  }
};
