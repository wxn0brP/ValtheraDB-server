import DataBase from "./database.js";
import Data from "./types/data.js";
/**
 * A class representing a graph database.
 * @class
 */
declare class Graph {
    db: DataBase;
    constructor(databaseFolder: string);
    /**
     * Adds an edge between two nodes.
     */
    add(collection: string, nodeA: string, nodeB: string): Promise<Data>;
    /**
     * Removes an edge between two nodes.
     */
    remove(collection: string, nodeA: string, nodeB: string): Promise<boolean>;
    /**
     * Finds all edges with either node equal to `node`.
     */
    find(collection: string, node: string): Promise<Data[]>;
    /**
     * Finds one edge with either node equal to `nodeA` and the other equal to `nodeB`.
     */
    findOne(collection: any, nodeA: any, nodeB: any): Promise<Data>;
    /**
     * Gets all edges in the database.
     */
    getAll(collection: any): Promise<Data[]>;
    /**
     * Get the names of all available databases.
     */
    getCollections(): Promise<string[]>;
    /**
     * Check and create the specified collection if it doesn't exist.
     */
    checkCollection(collection: any): Promise<void>;
    /**
     * Check if a collection exists.
     */
    issetCollection(collection: any): Promise<boolean>;
    /**
     * Removes a database collection from the file system.
     */
    removeCollection(collection: any): void;
}
export default Graph;
