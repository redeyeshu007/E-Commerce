import { describe, it, expect, vi } from "vitest";
import AdminHeroRedirectPage from "@/app/admin/hero/page";
import AdminHeroImagesRedirectPage from "@/app/admin/hero-images/page";
import * as navigation from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Admin Hero Pages Route Deprecation & Redirection Verification", () => {
  it("redirects /admin/hero route to /admin/navbar without standalone management page", () => {
    AdminHeroRedirectPage();
    expect(navigation.redirect).toHaveBeenCalledWith("/admin/navbar");
  });

  it("redirects /admin/hero-images route to /admin/navbar without standalone management page", () => {
    AdminHeroImagesRedirectPage();
    expect(navigation.redirect).toHaveBeenCalledWith("/admin/navbar");
  });
});
