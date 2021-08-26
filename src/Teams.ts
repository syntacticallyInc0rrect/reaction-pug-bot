import {MessageReaction, PartialUser, User} from "discord.js";
import {BotAction, BotActionOptions} from "./Api";

export let tmMsgId: string;
export let unassignedPlayers: (User | PartialUser)[] = [];
export let redTeamPlayers: (User | PartialUser)[] = [];
export let blueTeamPlayers: (User | PartialUser)[] = [];


export const Teams = (
    action: BotAction,
    reaction: MessageReaction,
    user: User | PartialUser,
    unassignedPlayers?: (User | PartialUser)[]
) => {
    switch (action) {
        case BotActionOptions.initialize:
            break;
        case BotActionOptions.reactionAdd:
            break;
        case BotActionOptions.reactionRemove:
            break;
        default:
            break;
    }
}