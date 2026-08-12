import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";

// Express 5 forwards rejected promises from async handlers to this error
// handler on its own, so routes don't need a wrapper.

/** Thrown deliberately by routes to return a specific status to the client. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Record not found
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    // Unique constraint
    if (err.code === "P2002") {
      return res.status(409).json({ error: "That value is already taken" });
    }
    // Foreign key constraint — usually deleting something still referenced
    if (err.code === "P2003") {
      return res.status(409).json({
        error: "This record is still referenced by other data and cannot be deleted",
      });
    }
  }

  // Never leak stack traces or file paths to the client.
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
