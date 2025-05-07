/**
 * Extrai o nome do clã do nome do usuário
 * O formato esperado é: "NOME_DO_CLÃ <nome>" para usuários com clã
 * Usuários sem clã têm seus nomes como: " <nome>"
 * @param userName Nome do usuário
 * @returns Nome do clã ou null se não houver clã
 */
const clanTagList: string[] = [
  "SPTS",
  "-COM",
  "=SF=",
  "=SD=",
  "SUS",
  "QRR",
  "*V*",
  "MC2",
  "DARE",
  "DATE",
  "FEB",
  "ADG",
  "102",
  "L|N",
  "DOT",
  "=IO",
  "[FI]",
  "SSB",
  "GTC",
  "SOG",
  "L|w",
  "OP|",
  "LDH",
  "-LAM",
  "FAL",
  "SAE",
  "SDC",
  "KKCK",
  "PTFS",
  "YPF",
  "FAA",
  "F.E.R",
  "TANGO",
  "RIM:",
  "vHc",
  "ZVIR",
  "TGS",
  "MST",
  "MTG",
  "PIL",
  "=WK=",
  "S.A.E",
  "KRK",
  "AFJ",
  "BDF",
  "VKS",
  "PKP",
  "FLAK",
  "1SGT",
  "BFE",
  "PMC",
  "GTE",
  "BBP",
  "[WD]",
  "VOID",
  "IRF",
  "IOS",
  "BUS",
  "=K=",
  "[HF]",
  "ROTAM",
  "CDD",
  "DFM",
  "[KP]",
  "STI",
  "LAFK",
  "[DF]",
  "K-9",
  "SAS",
  "MDJ",
  "MCMK",
  "BTHP",
  "BRM",
  "55",
];

export function extractClanName(userName: string): string | null {
  if (!userName) return null;

  const parts = userName.split(" ");
  let tag = "";
  if (parts.length == 2) tag = parts[0];
  let name = parts[parts.length - 1];
  const lowerTag = tag.toLowerCase();
  const lowerName = name.toLowerCase();

  if (tag != "")
    for (const clanTag of clanTagList) {
      const lowerClanTag = clanTag.toLowerCase();
      if (lowerTag.includes(lowerClanTag)) {
        return clanTag;
      }
    }

  for (const clanTag of clanTagList) {
    const lowerClanTag = clanTag.toLowerCase();
    if (lowerName.includes(lowerClanTag)) {
      return clanTag;
    }
  }

  if (tag == "") return null;
  else return tag;
}

/**
 * Extrai o nome do jogador sem a tag do clã
 * @param userName Nome do usuário com formato "NOME_DO_CLÃ <nome>" ou " <nome>"
 * @returns Apenas o nome do jogador sem a tag do clã
 */
export function extractPlayerName(userName: string): string {
  if (!userName) return "";

  const trimmedName = userName.trim();

  const spaceIndex = trimmedName.indexOf(" ");
  if (spaceIndex > 0) {
    return trimmedName.substring(spaceIndex + 1).trim();
  }

  return trimmedName;
}
