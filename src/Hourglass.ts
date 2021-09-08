import {mapPool} from "./Api";

export enum Side {
    Top = 0,
    Bottom = 1
}

export let hourglassMapPool: string[] = mapPool;
export let mapsTop: string[] = [...hourglassMapPool];
export let mapsBottom: string[] = [];
export let suggestedMaps: string[] = [];
export let side: Side = Side.Top;

//TODO: get rid of this once .env is replaced with backend calls
export const initializeHourglassForUnitTests = (mp: string[]) => {
    hourglassMapPool = mp;
    mapsTop = [...hourglassMapPool];
    mapsBottom = [];
    suggestedMaps = [];
    side = Side.Top;
};

export const Hourglass = () => {
    if (hourglassMapPool.length < 3) throw Error("Map Pool must contain at least 3 Maps!");
    const getRandomMap = (maps: string[]): string => {
        return maps[Math.floor(Math.random() * maps.length)];
    };
    const transferMap = (fromMaps: string[], toMaps: string[], randomMap: string) => {
        toMaps.push(randomMap);
        fromMaps.splice(fromMaps.indexOf(randomMap), 1);
        if (suggestedMaps.length > 2) {
            suggestedMaps = [];
        }
        suggestedMaps.push(randomMap);
    };
    const handleLessThanThreeMaps = (onTop: boolean, numberOfMaps: number) => {
        const push = (index: number) => onTop ? mapsBottom.push(mapsTop[index]) : mapsTop.push(mapsBottom[index]);
        numberOfMaps > 1 && push(1);
        numberOfMaps > 0 && push(0);
        onTop ? mapsTop = [] : mapsBottom = [];
        side = onTop ? Side.Bottom : Side.Top;
        Hourglass();
    };

    switch (side) {
        case Side.Top:
            if (mapsTop.length >= 3) {
                for (let i = 0; i < 3; i++) {
                    transferMap(mapsTop, mapsBottom, getRandomMap(mapsTop));
                }
                break;
            }
            handleLessThanThreeMaps(true, mapsTop.length);
            break;
        case Side.Bottom:
            if (mapsBottom.length >= 3) {
                for (let i = 0; i < 3; i++) {
                    transferMap(mapsBottom, mapsTop, getRandomMap(mapsBottom));
                }
                break;
            }
            handleLessThanThreeMaps(false, mapsBottom.length);
            break;
        default:
            break;
    }

};

/*
    (0RGSDOFCJftli;:.:. .  )
     T""""""""""""""""""""T
     |.;....,..........;..|
     |;;:: .  .    .      |
     l;;;:. :   .     ..  ;
     `;;:::.: .    .     .'
      l;;:. ..  .     .: ;
      `;;::.. .    .  ; .'
       l;;:: .  .    /  ;
        \;;:. .   .,'  /
         `\;:.. ..'  .'
           `\;:.. ..'
             \;:. /
              l; f
              `;f'
               ||
               ;l.
              ;: l
             / ;  \
           ,/  :   `.
         ./' . :     `.
        /' ,'  :       \
       f  /  . :        i
      ,' ;  .  :        `.
      f ;  .   :      .  i
     .'    :   :       . `.
     f ,  .    ;       :  i
     |    :  ,/`.       : |
     |    ;,/;:. `.     . |
     |___,/;;:. . .`._____|
    (QB0ZDOLC7itz!;:.:. .  )
     """"""""""""""""""""""
 */
