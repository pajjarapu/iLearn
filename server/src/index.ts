import { config } from "./config";
import { startServer } from "./server";

process.on("unhandledRejection", (error) => {
  console.error("[kitchen] unhandled rejection", error);
});

const { port } = await startServer(config.port);
console.log(`Kitchen Line server listening on http://127.0.0.1:${port}`);
console.log(`Mock agents: ${config.mockAgents ? "on" : "off"}`);
console.log(
  `Prices: $${config.priceInputPerMtok} in / $${config.priceOutputPerMtok} out per million tokens`,
);
console.log(`Database: ${config.databasePath}`);
if (!config.mockAgents) {
  console.log("Real mode opens a branch in the repo path you set. Model calls are not connected yet.");
}
