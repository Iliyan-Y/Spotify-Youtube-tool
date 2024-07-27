import "dotenv/config";
import * as express from "express";

const app = express();

const routes = require("./routes");
app.use("/", routes);

app.listen(3000);
