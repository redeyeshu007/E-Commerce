import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AdminInstagramPage from "@/app/admin/instagram/page";
import * as adminAuthService from "@/services/admin-auth-service";
import * as instagramService from "@/services/instagram-service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { InstagramSectionConfig, InstagramHistoryItem } from "@/types/instagram";

// Mock router
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
  usePathname: () => "/admin/instagram",
}));

const mockConfig: InstagramSectionConfig = {
  id: "current",
  heading: "Follow Us on Instagram",
  handle: "@peralagaeofficial",
  profileUrl: "https://www.instagram.com/peralagaeofficial/",
  isActive: true,
  version: 2,
  images: [
    {
      id: "img-1",
      imageUrl: "/images/instagram/insta-1-rings-bracelet.jpg",
      altText: "Gold ring",
      postUrl: "https://instagram.com/p/1",
      order: 0,
      isActive: true,
    },
    {
      id: "img-2",
      imageUrl: "/images/instagram/insta-2-diamond-earrings.jpg",
      altText: "Diamond earrings",
      postUrl: null,
      order: 1,
      isActive: true,
    },
  ],
};

const mockHistory: InstagramHistoryItem[] = [
  {
    id: "hist-1",
    version: 2,
    heading: "Follow Us on Instagram",
    handle: "@peralagaeofficial",
    profileUrl: "https://www.instagram.com/peralagaeofficial/",
    isActive: true,
    imagesCount: 2,
    createdAt: new Date().toISOString(),
    createdBy: "admin@peralagae.com",
  },
  {
    id: "hist-2",
    version: 1,
    heading: "Original Instagram",
    handle: "@peralagae_old",
    profileUrl: null,
    isActive: true,
    imagesCount: 6,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: "admin@peralagae.com",
  },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Admin Instagram Section Management Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(adminAuthService, "getAdminSession").mockResolvedValue({
      email: "admin@peralagae.com",
      role: "admin",
    });
    vi.spyOn(instagramService, "fetchAdminInstagramSection").mockResolvedValue(mockConfig);
    vi.spyOn(instagramService, "fetchAdminInstagramHistory").mockResolvedValue(mockHistory);
    vi.spyOn(instagramService, "updateAdminInstagramSection").mockResolvedValue({
      ...mockConfig,
      version: 3,
    });
    vi.spyOn(instagramService, "restoreAdminInstagramVersion").mockResolvedValue(mockConfig);
  });

  it("redirects unauthenticated users to /admin/login", async () => {
    vi.spyOn(adminAuthService, "getAdminSession").mockRejectedValue(new Error("Unauthorized"));

    renderWithClient(<AdminInstagramPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/admin/login");
    });
  });

  it("loads section settings and displays image cards for authenticated admin", async () => {
    renderWithClient(<AdminInstagramPage />);

    await waitFor(() => {
      expect(screen.getByText("Gallery Images (2)")).toBeInTheDocument();
    });

    // Check heading input has initial value
    const headingInput = screen.getByPlaceholderText("e.g. Follow Us on Instagram") as HTMLInputElement;
    expect(headingInput.value).toBe("Follow Us on Instagram");

    // Check handle input has initial value
    const handleInput = screen.getByPlaceholderText("e.g. @peralagaeofficial") as HTMLInputElement;
    expect(handleInput.value).toBe("@peralagaeofficial");

    // Check image count badge
    expect(screen.getByText("Gallery Images (2)")).toBeInTheDocument();

    // Check #1 and #2 badges
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("allows editing heading and publishing changes", async () => {
    renderWithClient(<AdminInstagramPage />);

    await waitFor(() => {
      expect(screen.getByText("Gallery Images (2)")).toBeInTheDocument();
    });

    const headingInput = screen.getByPlaceholderText("e.g. Follow Us on Instagram");
    fireEvent.change(headingInput, { target: { value: "Our Curated Instagram Gallery" } });

    const publishBtn = screen.getByRole("button", { name: /save & publish changes/i });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(instagramService.updateAdminInstagramSection).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: "Our Curated Instagram Gallery",
          handle: "@peralagaeofficial",
        })
      );
    });

    expect(screen.getByText(/published successfully as version 3/i)).toBeInTheDocument();
  });

  it("reorders images when Move Right is clicked", async () => {
    renderWithClient(<AdminInstagramPage />);

    await waitFor(() => {
      expect(screen.getByText("#1")).toBeInTheDocument();
    });

    const moveRightBtns = screen.getAllByTitle("Move Right");
    expect(moveRightBtns[0]).not.toBeDisabled();

    fireEvent.click(moveRightBtns[0]!);

    // Card 1 should now be second
    const publishBtn = screen.getByRole("button", { name: /save & publish changes/i });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(instagramService.updateAdminInstagramSection).toHaveBeenCalledWith(
        expect.objectContaining({
          images: expect.arrayContaining([
            expect.objectContaining({ id: "img-2", order: 0 }),
            expect.objectContaining({ id: "img-1", order: 1 }),
          ]),
        })
      );
    });
  });

  it("switches to Version History tab and shows past snapshots", async () => {
    renderWithClient(<AdminInstagramPage />);

    await waitFor(() => {
      expect(screen.getByText("Instagram Section Management")).toBeInTheDocument();
    });

    const historyTabBtn = screen.getByRole("button", { name: /version history/i });
    fireEvent.click(historyTabBtn);

    await waitFor(() => {
      expect(screen.getByText("Publication History & Snapshots")).toBeInTheDocument();
      expect(screen.getByText("Version 2")).toBeInTheDocument();
      expect(screen.getByText("Version 1")).toBeInTheDocument();
    });
  });

  it("allows restoring an older version snapshot", async () => {
    renderWithClient(<AdminInstagramPage />);

    await waitFor(() => {
      expect(screen.getByText("Instagram Section Management")).toBeInTheDocument();
    });

    // Switch to history tab
    fireEvent.click(screen.getByRole("button", { name: /version history/i }));

    await waitFor(() => {
      expect(screen.getByText("Restore v1")).toBeInTheDocument();
    });

    // Click Restore v1
    fireEvent.click(screen.getByText("Restore v1"));

    // Modal appears
    await waitFor(() => {
      expect(screen.getByText("Restore Version 1?")).toBeInTheDocument();
    });

    // Confirm restore
    fireEvent.click(screen.getByRole("button", { name: /confirm restore/i }));

    await waitFor(() => {
      expect(instagramService.restoreAdminInstagramVersion).toHaveBeenCalledWith("hist-2");
    });
  });
});
