import assert from "node:assert/strict";
import test from "node:test";
import type { NextApiRequest, NextApiResponse } from "next";
import councilHandler from "../src/pages/api/council";

function createMockRes<T>() {
  const store: { statusCode: number; json: T | null } = {
    statusCode: 200,
    json: null
  };

  const res: Partial<NextApiResponse<T>> = {
    status(code: number) {
      store.statusCode = code;
      return this as NextApiResponse<T>;
    },
    json(payload: T) {
      store.json = payload;
      return this as NextApiResponse<T>;
    },
    setHeader() {
      return;
    }
  };

  return { res: res as NextApiResponse<T>, store };
}

test("GET /api/council returns log entries", async () => {
  const { res, store } = createMockRes<{ entries: unknown[] }>();
  const req = { method: "GET" } as NextApiRequest;

  await councilHandler(req, res);

  assert.equal(store.statusCode, 200);
  assert.ok(Array.isArray(store.json?.entries));
});

test("POST /api/council validates input", async () => {
  const { res, store } = createMockRes<{ error: string }>();
  const req = { method: "POST", body: {} } as unknown as NextApiRequest;

  await councilHandler(req, res);

  assert.equal(store.statusCode, 400);
  assert.match(store.json?.error ?? "", /messages/i);
});
