/**
 * Extrai o nome do clã do nome do usuário
 * O formato esperado é: "NOME_DO_CLÃ <nome>" para usuários com clã
 * Usuários sem clã têm seus nomes como: " <nome>"
 * @param userName Nome do usuário
 * @returns Nome do clã ou null se não houver clã
 */
export function extractClanName(userName: string): string | null {
  if (!userName) return null;

  const trimmedName = userName.trim();

  if (trimmedName.startsWith(" ")) {
    return null;
  }

  const spaceIndex = trimmedName.indexOf(" ");
  if (spaceIndex > 0) {
    return trimmedName.substring(0, spaceIndex);
  }

  return null;
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
