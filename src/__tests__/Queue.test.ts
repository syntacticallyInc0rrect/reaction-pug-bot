import {getChannel, getTextChannel, Queue} from "../Queue";
import {VoiceChannel} from "discord.js";

describe("Queue", () => {
    const voiceChannelMock = () => (({} as unknown) as VoiceChannel);
    const voiceChannel: VoiceChannel = voiceChannelMock();

    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.clearAllTimers());

    test("send initial embed is called when queue is called with initialize action", () => {
        //TODO
    });

    test("get channel throws an error when no channel is found in the client", () => {
        expect(() => {
            getChannel();
        }).toThrowError("Your Client does not have any Channels. This is a problem.");
    });

    test("get text channel throws an error when channel is not a text channel", () => {
        expect(() => {
            getTextChannel(voiceChannel);
        }).toThrowError("Your channel is not a Text Channel. Please correct your Channel ID");
    });


});