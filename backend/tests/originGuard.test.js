const test = require("node:test");
const assert = require("node:assert/strict");
const originGuard = require("../src/middleware/originGuard");

function evaluateGuard(origin, allowedOrigins) {
  let nextCalled = false;
  let statusCode = null;
  let responseBody = null;
  const req = { get: (header) => (header.toLowerCase() === "origin" ? origin : undefined) };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  originGuard(allowedOrigins)(req, res, () => { nextCalled = true; });
  return { nextCalled, statusCode, responseBody };
}

test("auth origin guard allows localhost on any port during development", () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    assert.equal(evaluateGuard("http://localhost:5175", []).nextCalled, true);
    assert.equal(evaluateGuard("http://127.0.0.1:4173", []).nextCalled, true);
    assert.equal(evaluateGuard("http://[::1]:5173", []).nextCalled, true);
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});

test("auth origin guard does not accept lookalike hosts or non-local development origins", () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    const lookalike = evaluateGuard("http://localhost.example.com:5175", []);
    assert.equal(lookalike.statusCode, 403);
    assert.deepEqual(lookalike.responseBody, { message: "Request origin is not allowed." });
    assert.equal(evaluateGuard("https://localhost:5175", []).statusCode, 403);
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});

test("production auth origin guard requires an exact configured origin", () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.equal(evaluateGuard("https://heartlink.example", ["https://heartlink.example"]).nextCalled, true);
    assert.equal(evaluateGuard("http://localhost:5175", ["https://heartlink.example"]).statusCode, 403);
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});
