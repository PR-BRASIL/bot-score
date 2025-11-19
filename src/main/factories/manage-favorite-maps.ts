import { ManageFavoriteMapsCommand } from "../../presentation/commands/manage-favorite-maps";

export const makeManageFavoriteMapsCommand = () => {
  return new ManageFavoriteMapsCommand();
};

