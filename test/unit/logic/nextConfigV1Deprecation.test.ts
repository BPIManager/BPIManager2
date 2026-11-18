import { describe, it, expect } from "vitest";
import nextConfig from "../../../next.config";

describe("next.config: API v1 の廃止予告ヘッダー", () => {
  it("/api/v1/:path* に Deprecation・Sunset・Link を付け、v2 の同じパスを successor-version にする", async () => {
    const rule = (await nextConfig.headers!()).find((h) => h.source === "/api/v1/:path*");
    expect(rule).toBeDefined();
    const h = Object.fromEntries(rule!.headers.map((x) => [x.key, x.value]));

    // 2026-11-19 00:00 JST (RFC 9745: @<UNIX秒>)
    expect(h.Deprecation).toBe("@1795014000");
    // 2027-01-01 00:00 JST (RFC 8594: HTTP-date)
    expect(h.Sunset).toBe("Thu, 31 Dec 2026 15:00:00 GMT");
    expect(new Date(h.Sunset).getTime()).toBeGreaterThan(Number(h.Deprecation.slice(1)) * 1000);
    expect(h.Link).toContain('</api/v2/:path*>; rel="successor-version"');
    expect(h.Link).toContain('rel="deprecation"');
    expect(h.Link).toContain("https://bpim2.apidog.io/");
  });

  it("v2 のパスには付けない", async () => {
    const sources = (await nextConfig.headers!()).map((h) => h.source);
    expect(sources.filter((s) => s.startsWith("/api/v2"))).toEqual([]);
  });
});
