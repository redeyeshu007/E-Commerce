import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryLoaderBoundary } from "@/components/shared/query-loader-boundary";

describe("QueryLoaderBoundary State Management", () => {
  it("renders AppLoader during loading state", () => {
    render(
      <QueryLoaderBoundary
        isLoading={true}
        loadingMessage="Loading catalogue..."
        data={null}
      >
        {() => <div>Loaded Content</div>}
      </QueryLoaderBoundary>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading catalogue...")).toBeInTheDocument();
    expect(screen.queryByText("Loaded Content")).not.toBeInTheDocument();
  });

  it("renders error alert with retry button when error occurs", () => {
    const handleRetry = vi.fn();

    render(
      <QueryLoaderBoundary
        isLoading={false}
        isError={true}
        error={new Error("Network connection dropped")}
        onRetry={handleRetry}
        data={null}
      >
        {() => <div>Loaded Content</div>}
      </QueryLoaderBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Network connection dropped")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when data array is empty without permanent loader", () => {
    render(
      <QueryLoaderBoundary
        isLoading={false}
        data={[]}
        emptyTitle="No rings found"
        emptyMessage="Try adjusting your filter selection."
      >
        {() => <div>Loaded Content</div>}
      </QueryLoaderBoundary>,
    );

    expect(screen.queryByTestId("app-loader")).not.toBeInTheDocument();
    expect(screen.getByTestId("query-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No rings found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filter selection.")).toBeInTheDocument();
  });

  it("renders children with data upon successful retrieval", () => {
    render(
      <QueryLoaderBoundary
        isLoading={false}
        data={[{ id: "ring-1", name: "Solitaire Diamond Ring" }]}
      >
        {(items) => (
          <ul>
            {items.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        )}
      </QueryLoaderBoundary>,
    );

    expect(screen.getByText("Solitaire Diamond Ring")).toBeInTheDocument();
  });
});
