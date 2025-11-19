import { RemoveFavoriteMapCommand } from "../../presentation/commands/remove-favorite-map";

export const makeRemoveFavoriteMapCommand = () => {
  return new RemoveFavoriteMapCommand();
};

