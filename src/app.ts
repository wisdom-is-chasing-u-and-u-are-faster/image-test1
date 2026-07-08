import express from "express";
import dotenv from "dotenv";
import locationsRouter from "./routes/locations";
import matchesRouter from "./routes/matches";

dotenv.config();

const app = express();

app.use(express.json());

// Health Check Endpoint
app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// App Router Wiring
app.use("/v1/locations", locationsRouter);
app.use("/v1/matches", matchesRouter);

export default app;
export { app };
