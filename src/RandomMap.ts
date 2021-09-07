import {mapPool} from "./Api";

export let randomMapPool: string[] = mapPool;
export let lastThreeMaps: string[] = [];
export let randomMap: string;

export const RandomMap = () => {
    const getRandomMap = (): string => {
        return randomMapPool[Math.floor(Math.random() * randomMapPool.length)];
    };
    const assignRandomMap = (rm: string) => {
        lastThreeMaps.push(rm);
        randomMapPool.splice(randomMapPool.indexOf(rm));
        if (lastThreeMaps.length > 3) {
            randomMapPool.push(lastThreeMaps[0]);
            lastThreeMaps.splice(0, 1);
        }
        randomMap = rm;
    };

    assignRandomMap(getRandomMap());

};
