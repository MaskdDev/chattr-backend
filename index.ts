import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth.ts";
import apiSpec from "./openapi.yaml";
import swaggerUi from "swagger-ui-express";
import userRouter from "./routes/users.ts";

// Create Express application and HTTP server
const app = express();
const server = createServer(app);

// Use CORS and logging middleware
app.use(cors());
app.use(morgan(":method :url :status"));

// Use Better Auth routes
app.all("/api/auth/{*any}", toNodeHandler(auth));

// Use JSON middleware
app.use(express.json());

// Expose Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(apiSpec));

// Add routers
app.use("/users", userRouter);

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
