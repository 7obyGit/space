import "reflect-metadata";
import { container } from "tsyringe";
import { CliController } from "./controller/CliController.js";

const cliController = container.resolve(CliController);
await cliController.run();
