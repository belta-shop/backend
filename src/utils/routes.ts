import { Request } from "express";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../config/global";
import Unauthorized from "../errors/unauthorized";

export function getSearchQuery(search: any, keys: string[]) {
  if (typeof search !== "string" || !search) return {};

  return {
    $or: keys.map((key) => ({ [key]: { $regex: search, $options: "i" } })),
  };
}

export function getPagination(query: Request["query"]) {
  const { page, limit } = query;

  const currentPage = page ? parseInt(page as string) : DEFAULT_PAGE;
  const currentLimit = limit ? parseInt(limit as string) : DEFAULT_LIMIT;
  const skip = (currentPage - 1) * currentLimit;

  return { skip, limit: currentLimit };
}

export function onlyAdminCanModify(
  req: Request,
  document: { employeeReadOnly: boolean }
) {
  if (document.employeeReadOnly && req.currentUser?.role !== "admin") {
    throw new Unauthorized("Only admin can modify or delete this document");
  }
}

export function onlyAdminCanSetReadOnly(req: Request) {
  if (req.body.employeeReadOnly && req.currentUser?.role !== "admin") {
    throw new Unauthorized(
      "Only admin can modify or set employeeReadOnly to true"
    );
  }
}
