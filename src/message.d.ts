interface IAbsTime {
    type: "ABS";
    hours: number; //(-1 if undefined)
    minutes: number; //(-1 if undefined)
    clock: 12 | 24;
    meridian?: "AM" | "PM";
} 
interface IRelTime {
    type: "REL";
    seconds: number,
    unit: "SEC" | "MIN" | "HR";
    unitFactor: 1 | 60 | 3600;
    e10: number;
    newRel?: boolean;
}

interface IMessageInfo {
    list: Array<IAbsTime | IRelTime>; 
    message: string;
}

declare function parse(input: string): IMessageInfo;

export { IMessageInfo, IAbsTime, IRelTime, parse };