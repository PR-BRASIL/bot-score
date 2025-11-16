import { SeasonTopPlayersCommand } from "../../presentation/commands/season-top-players";

export const makeSeasonTopPlayersCommand = () => {
  const command = new SeasonTopPlayersCommand();
  return command;
};


