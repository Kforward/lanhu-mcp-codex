import { describe, expect, it, vi } from "vitest";
import { LanhuHttpClient, LanhuHttpError } from "../src/core/http.js";

describe("LanhuHttpClient", () => {
  it("sends the configured Cookie header and parses JSON", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
    const client = new LanhuHttpClient({ cookie: "session=fake", fetchImpl });

    const result = await client.getJson<{ ok: boolean }>("/api/example");

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      Cookie: "session=fake"
    });
  });

  it("throws a structured error when Cookie is missing", () => {
    expect(() => new LanhuHttpClient({ cookie: "" })).toThrow(LanhuHttpError);
    expect(() => new LanhuHttpClient({ cookie: "" })).toThrow(/LANHU_COOKIE/);
  });

  it("maps 418 responses to permission or session errors", async () => {
    const fetchImpl = vi.fn(async () => new Response("expired", { status: 418 })) as unknown as typeof fetch;
    const client = new LanhuHttpClient({ cookie: "session=fake", fetchImpl });

    await expect(client.getJson("/api/example")).rejects.toMatchObject({
      code: "LANHU_PERMISSION_OR_SESSION_ERROR",
      status: 418
    });
  });

  it("throws a structured error for non JSON responses", async () => {
    const fetchImpl = vi.fn(async () => new Response("<html>login</html>", { status: 200 })) as unknown as typeof fetch;
    const client = new LanhuHttpClient({ cookie: "session=fake", fetchImpl });

    await expect(client.getJson("/api/example")).rejects.toMatchObject({
      code: "LANHU_NON_JSON_RESPONSE"
    });
  });
});
