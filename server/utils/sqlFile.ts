
const unsupportedCommands = [
    "CREATE DATABASE",
    "USE",
];

class SQLFileParser {
    /**
     * Main method parsing SQL file and returning an array of SQL queries.
     * @param sqlContent - Content of the SQL file as a string.
     * @returns An array of SQL queries processed for the engine.
     */
    parse(sqlContent: string): string[] {
        const withoutComments = this.removeComments(sqlContent);
        const queries = this.splitQueries(withoutComments);
        const filteredQueries = this.filterUnsupportedQueries(queries);
        const processedQueries = this.processInserts(filteredQueries);

        return processedQueries;
    }

    /**
     * Removes comments from SQL code.
     * Supports both single-line comments (--), and multi-line comments (\/\* ... \*\/).
     * @param sqlContent - Content of the SQL file.
     * @returns Content of the SQL file without comments.
     */
    private removeComments(sqlContent: string): string {
        let result = sqlContent.replace(/\/\*[\s\S]*?\*\//g, "");
        result = result.replace(/--.*$/gm, "");

        return result;
    }

    /**
     * Splits the SQL content into individual queries.
     * Assumes that queries are separated by semicolons (;).
     * @param sqlContent - Content of the SQL file.
     * @returns An array of SQL queries.
     */
    private splitQueries(sqlContent: string): string[] {
        return sqlContent
            .split(";")
            .map(query => query.trim())
            .filter(query => query.length > 0);
    }

    /**
     * Filters out unsupported queries like CREATE DATABASE and USE.
     * @param queries - An array of SQL queries.
     * @returns An array of supported SQL queries.
     */
    private filterUnsupportedQueries(queries: string[]): string[] {
        return queries.filter(query => {
            const upperQuery = query.toUpperCase();
            return !unsupportedCommands.some(cmd => upperQuery.startsWith(cmd));
        });
    }

    /**
     * Processes INSERT queries with multiple values into single INSERTs.
     * @param queries - An array of SQL queries.
     * @returns An array of processed SQL queries.
     */
    private processInserts(queries: string[]): string[] {
        const processedQueries: string[] = [];

        for (const query of queries) {
            if (query.toUpperCase().startsWith("INSERT")) {
                // Split the INSERT query into individual values
                const [insertPart, valuesPart] = query.split("VALUES");
                if (!valuesPart) {
                    throw new Error(`Invalid INSERT query: ${query}`);
                }

                // Extract the values in parentheses
                const valuesMatch = valuesPart.match(/\(([^)]+)\)/g);
                if (!valuesMatch) {
                    throw new Error(`No values found in INSERT query: ${query}`);
                }

                // For each value, create a separate INSERT query
                for (const value of valuesMatch) {
                    processedQueries.push(`${insertPart} VALUES ${value}`);
                }
            } else {
                // If it's not an INSERT query, add it without changes
                processedQueries.push(query);
            }
        }

        return processedQueries;
    }
}

const sqlSplitter = new SQLFileParser();
export default sqlSplitter;