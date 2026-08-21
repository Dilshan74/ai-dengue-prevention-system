import app from "./src/app.js";
import { env } from "./src/config/env.js";
import connectDB from "./src/config/db.js";

connectDB();

app.listen(env.port, () => {
  console.log(`DengueGuard AI backend running on http://localhost:${env.port}`);
});