import { Logger, LogLevelName } from "@wxn0brp/lucerna-log";
import { ConsoleTransport } from "@wxn0brp/lucerna-log/transports/console";
import { FileTransport } from "@wxn0brp/lucerna-log/transports/file";

const logLevel = (process.env.LOG_LEVEL || "INFO") as LogLevelName;
const logFile = process.env.LOG_FILE || "./logs/server.log";

const logger = new Logger({
	transports: [
		new ConsoleTransport(),
		new FileTransport(logFile),
	],
	loggerName: "ValtheraDB-Server",
	logLevel,
});

export default logger;
