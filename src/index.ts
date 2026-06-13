import { ConfigService } from "./service/ConfigService.js";
import { SpaceService } from "./service/SpaceService.js";

console.log("\nRunning with config:");
const config = await ConfigService.get();
console.log(config);

console.log("\nAvailable spaces directories:");
console.log(await SpaceService.getSpacesPaths());

console.log("\nSpaces:");
console.log(await SpaceService.list());
