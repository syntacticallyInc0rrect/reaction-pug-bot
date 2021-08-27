import {BotAction, BotActionOptions} from "./Api";
import {MessageReaction, PartialUser, User} from "discord.js";
import {blueTeamPlayers, redTeamPlayers} from "./Teams";

export const Finalize = (
    action: BotAction,
    msgId: string,
    mapToBePlayed: string,
    reaction?: MessageReaction,
    user?: User | PartialUser,
) => {

    const handleReactionAdd = (reaction?: MessageReaction, user?: User | PartialUser) => {
        if (!reaction || !user) throw Error("Tried to add a Reaction to the Finalize Embed without a Reaction or a User.")
        const playerIsInThisPug: boolean = !!redTeamPlayers.find(u => u === user) ||
            !!blueTeamPlayers.find(u => u === user);

        if (!playerIsInThisPug) {
            return;
        }

        switch (reaction.emoji.name) {

        }
    };

    switch (action) {
        case BotActionOptions.initialize:
            break;
        case BotActionOptions.reactionAdd:
            handleReactionAdd(reaction, user);
            break;
        default:
            break;
    }
};