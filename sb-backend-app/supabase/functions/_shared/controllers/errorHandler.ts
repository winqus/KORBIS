import express from "express";
import { BadRequestError } from "../errors/index.ts";

export function handleError(
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
): void {
  if (error instanceof BadRequestError) {
    const message = typeof error.message === "string"
      ? JSON.parse(error.message)
      : error.message;
    console.error("BadRequestError:");
    res.status(400).json({ error: "Bad Request", details: message });
  } else if (error instanceof Error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  } else {
    console.error("Unknown error:", error);
    res.status(500).json({ error: "Unknown error" });
  }
}
