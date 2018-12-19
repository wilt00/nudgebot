type IAbsTime = [number, number];
type IRelTime = number;

interface IMessageInfo {
    time: IAbsTime | IRelTime; 
    message: string;
}

declare function parse(input: string): IMessageInfo;

export { IMessageInfo, IAbsTime, IRelTime, parse };