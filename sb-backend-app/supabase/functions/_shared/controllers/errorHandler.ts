import express from "express";
import { BadRequestError, MissingEnvVariableError } from "../errors/index.ts";
import { isLocalEnv } from "../utils.ts";

export function handleError(
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
): void {
  const isDevelopment = Deno.env.get("ENVIRONMENT") === "development" || isLocalEnv();

  if (error instanceof BadRequestError) {
    const message = typeof error.message === "string"
      ? JSON.parse(error.message)
      : error.message;
    console.error("BadRequestError:", message);
    res.status(400).json({
      error: "Bad Request",
      details: message,
      ...(isDevelopment && { __devInfo: error.message }),
    });
  } else if (error instanceof MissingEnvVariableError) {
    console.error("MissingEnvVariableError:", error.message);
    res.status(500).json({
      error: "Internal Server Error. Check server logs",
      ...(isDevelopment && { __devInfo: error.message }),
    });
  } else if (error instanceof Error) {
    console.error("Error:", error.message);
    res.status(500).json({
      error: "Internal Server Error. Check server logs",
      ...(isDevelopment && { __devInfo: error.message }),
    });
  } else {
    console.error("Unknown error:", error);
    res.status(500).json({
      error: "Internal Server Error. Check server logs",
      ...(isDevelopment && { __devInfo: String(error) }),
    });
  }
}
