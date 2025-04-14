import { Context } from "../types/types.js";
import { Search, Updater } from "../types/arg.js";
import Data from "../types/data.js";
import FileCpu from "../types/fileCpu.js";
import { FindOpts } from "../types/options.js";
import { Transaction } from "../types/transactions.js";
export type WriteFile = (file: string, data: any[]) => Promise<void>;
export type ReadFile = (file: string) => Promise<any[]>;
declare class CustomFileCpu implements FileCpu {
    _readFile: ReadFile;
    _writeFile: WriteFile;
    constructor(readFile: ReadFile, writeFile: WriteFile);
    add(file: string, data: Data): Promise<void>;
    find(file: string, arg: Search, context?: Context, findOpts?: FindOpts): Promise<any[] | false>;
    findOne(file: string, arg: Search, context?: Context, findOpts?: FindOpts): Promise<any | false>;
    findStream(file: string, arg: Search, context?: Context, findOpts?: FindOpts, limit?: number): AsyncGenerator<any>;
    remove(file: string, one: boolean, arg: Search, context?: Context): Promise<boolean>;
    update(file: string, one: boolean, arg: Search, updater: Updater, context?: Context): Promise<boolean>;
    transactions(file: string, transactions: Transaction[]): Promise<void>;
}
export default CustomFileCpu;
