import "reflect-metadata";
import { container } from "tsyringe";
import { ConfigService } from "./service/ConfigService.js";
import { SpaceService } from "./service/SpaceService.js";

const configService = container.resolve(ConfigService);
const spaceService = container.resolve(SpaceService);

console.log("\nRunning with config:");
const config = await configService.get();
console.log(config);

console.log("\nAvailable spaces directories:");
console.log(await spaceService.getSpacesPaths());

console.log("\nSpaces:");
console.log(await spaceService.list());

console.log("\nActive Space:");
console.log(await spaceService.getActive());
