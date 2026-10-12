
import "dotenv/config";
import pino from "pino";
import app from "./app.js";

const logger = pino();
const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  logger.info({ port }, "TenantAI backend started");
});
