import type * as SessionModule from "./session.server";
import type { db as PrismaDb } from "./db.server";

jest.mock("./db.server", () => ({
  db: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

function rejectedResponse<T>(promise: Promise<T>): Promise<Response> {
  return promise.then(
    () => {
      throw new Error("Expected the operation to throw a Response");
    },
    (error) => error as Response
  );
}

describe("SSO session guards", () => {
  const originalEnv = process.env;
  let session: typeof SessionModule;
  let db: typeof PrismaDb;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      SESSION_SECRET: "test-session-secret",
      SSO_AUTH_ENABLED: "true",
      SSO_ALLOWED_EMAILS: "allowed@example.com",
    };
    session = require("./session.server");
    db = require("./db.server").db;
    jest.clearAllMocks();
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: "sso-user-id",
      username: "allowed@example.com",
      isAdmin: true,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("authorizes a valid SSO identity without requiring a cookie session", async () => {
    const request = new Request("https://gifable.example/", {
      headers: { "X-Forwarded-Email": " Allowed@Example.com " },
    });

    await expect(session.requireUserId(request)).resolves.toBe("sso-user-id");
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { username: "allowed@example.com" },
    });
  });

  it("redirects a request without an allowed SSO identity to login", async () => {
    const request = new Request("https://gifable.example/");

    const response = await rejectedResponse(session.requireUserId(request));

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login?redirectTo=%2F");
  });

  it("only redirects SSO login to home when the forwarded identity is allowed", async () => {
    const allowedRequest = new Request("https://gifable.example/login", {
      headers: { "X-Forwarded-Email": "allowed@example.com" },
    });
    const deniedRequests = [
      new Request("https://gifable.example/login", {
        headers: { "X-Forwarded-Email": "outsider@example.com" },
      }),
      new Request("https://gifable.example/login"),
    ];

    const response = await session.getSsoLoginRedirect(allowedRequest);
    expect(response?.status).toBe(302);
    expect(response?.headers.get("Location")).toBe("/");

    for (const request of deniedRequests) {
      const deniedResponse = await rejectedResponse(
        session.getSsoLoginRedirect(request)
      );
      expect(deniedResponse.status).toBe(403);
      expect(deniedResponse.headers.get("Location")).toBeNull();
    }
  });
});
