import assert from "node:assert/strict";
import test from "node:test";
import type { NextApiRequest, NextApiResponse } from "next";
import metaHandler from "../src/pages/api/meta";

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

test("GET /api/meta returns service overview", async () => {
  const { res, store } = createMockRes<any>();
  const req = { method: "GET" } as NextApiRequest;

  await metaHandler(req, res);

  assert.equal(store.statusCode, 200);
  assert.ok(store.json?.services);
  assert.ok(store.json?.uptime);
});

test("POST /api/meta is not allowed", async () => {
  const { res, store } = createMockRes<{ error: string }>();
  const req = { method: "POST" } as NextApiRequest;

  await metaHandler(req, res);

  assert.equal(store.statusCode, 405);
  assert.match(store.json?.error ?? "", /not allowed/i);
});
