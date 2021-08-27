import {BanOption, TeamOption} from "../Maps";

describe("Maps", () => {
    describe("getHighestVotedOption", () => {
        const optionOne: BanOption = new BanOption("banOptionOne", 0);
        const optionTwo: BanOption = new BanOption("banOptionTwo", 0);
        const optionThree: BanOption = new BanOption("banOptionThree", 0);
        let teamOption: TeamOption = new TeamOption("Dream Team", optionOne, optionTwo, optionThree)

        afterEach(() => {
            optionOne.count = 0;
            optionTwo.count = 0;
            optionThree.count = 0;
        });

        test("returns highest value of three unique numbers", () => {
            optionOne.count = 0;
            optionTwo.count = 4;
            optionThree.count = 1;
            expect(teamOption.getHighestVotedOption().count).toEqual(optionTwo.count);
            optionOne.count = 10;
            expect(teamOption.getHighestVotedOption().count).toEqual(optionOne.count);
            optionThree.count = 20;
            expect(teamOption.getHighestVotedOption().count).toEqual(optionThree.count);
        });

        test("returns earliest option between tie when called with false or no argument", () => {
            expect(teamOption.getHighestVotedOption()).toEqual(optionOne);
            expect(teamOption.getHighestVotedOption(false)).toEqual(optionOne);
            optionTwo.count = 2;
            optionThree.count = 2;
            expect(teamOption.getHighestVotedOption()).toEqual(optionTwo);
            expect(teamOption.getHighestVotedOption(false)).toEqual(optionTwo);
            optionOne.count = 2;
            optionTwo.count = 1;
            expect(teamOption.getHighestVotedOption()).toEqual(optionOne);
            expect(teamOption.getHighestVotedOption(false)).toEqual(optionOne);
            optionThree.count = 10;
            expect(teamOption.getHighestVotedOption()).toEqual(optionThree);
            expect(teamOption.getHighestVotedOption(false)).toEqual(optionThree);
        });

        test("returns latest option between tie when called with true", () => {
            expect(teamOption.getHighestVotedOption(true)).toEqual(optionThree);
            optionTwo.count = 2;
            optionThree.count = 2;
            expect(teamOption.getHighestVotedOption(true)).toEqual(optionThree);
            optionOne.count = 2;
            optionTwo.count = 1;
            expect(teamOption.getHighestVotedOption(true)).toEqual(optionThree);
            optionOne.count = 10;
            expect(teamOption.getHighestVotedOption(true)).toEqual(optionOne);
        });

    });

});