import {Teams} from "../Teams";
import {BotActionOptions} from "../Api";
import {MessageReaction, User, VoiceChannel} from "discord.js";

describe("Teams", () => {
    const reactionMock = () => (({} as unknown) as MessageReaction);
    const userMock = () => (({} as unknown) as User);
    const reaction: MessageReaction = reactionMock();
    const user: User = userMock();

    test("teams throws an error when it is not provided an array of queued players", () => {
        expect(() => {
            Teams(BotActionOptions.initialize, reaction, user);
        }).toThrowError("There are no Queued Players to form Teams from.");
    })
})