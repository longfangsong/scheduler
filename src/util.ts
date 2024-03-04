import * as math from "mathjs";

export function lcm(arr: Array<number>) {
    return arr.reduce((a, b) => math.lcm(a, b));
}
