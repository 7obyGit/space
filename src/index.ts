import "reflect-metadata";
import { container } from "tsyringe";
import { ConfigService } from "./service/ConfigService.js";
import { LoggerService } from "./service/LoggerService.js";
import { SpaceService } from "./service/SpaceService.js";

const configService = container.resolve(ConfigService);
const spaceService = container.resolve(SpaceService);
const loggerService = container.resolve(LoggerService);

loggerService.info("\nRunning with config:");
const config = await configService.get();
loggerService.info(config);

loggerService.info("\nAvailable spaces directories:");
loggerService.info(await spaceService.getSpacesPaths());

loggerService.info("\nSpaces:");
loggerService.info(await spaceService.list());

loggerService.info("\nActive Space:");
loggerService.info(await spaceService.getActive());
