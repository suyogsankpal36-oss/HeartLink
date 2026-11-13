const test = require("node:test");
const assert = require("node:assert/strict");

const {
  REFRESH_COOKIE,
  getRefreshCookieOptions,
  readCookie,
} = require("../src/services/authTokens");

function withEnvironment(values, callback) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  try {
    callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("production refresh cookie is secure, httpOnly, cross-site compatible, and valid for all auth aliases", () => {
  withEnvironment({ NODE_ENV: "production", COOKIE_SAME_SITE: "none", COOKIE_DOMAIN: "" }, () => {
    const options = getRefreshCookieOptions();
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, "none");
    assert.equal(options.path, "/");
    assert.equal("domain" in options, false, "Render deployments should use a host-only cookie by default");
    assert.ok(options.maxAge > 0);
  });
});

test("refresh cookie reader prefers the current root-scoped token when a legacy /api cookie also exists", () => {
  const request = {
    headers: {
      cookie: `${REFRESH_COOKIE}=legacy-path-token; another=value; ${REFRESH_COOKIE}=current-root-token`,
    },
  };
  assert.equal(readCookie(request, REFRESH_COOKIE), "current-root-token");
});
