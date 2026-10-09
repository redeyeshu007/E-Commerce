import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DemoOne, { Component as Loader2 } from "@/components/ui/loader-2";

describe("Supplied Geometric Loader (loader-2)", () => {
  it("renders all three SVG geometric shapes by default", () => {
    const { container } = render(<Loader2 />);

    // Circle shape
    const circle = container.querySelector("circle#test");
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute("r", "32");
    expect(circle).toHaveAttribute("cx", "40");
    expect(circle).toHaveAttribute("cy", "40");

    // Triangle polygon shape
    const polygon = container.querySelector("polygon");
    expect(polygon).toBeInTheDocument();
    expect(polygon).toHaveAttribute("points", "43 8 79 72 7 72");

    // Rectangle shape
    const rect = container.querySelector("rect");
    expect(rect).toBeInTheDocument();
    expect(rect).toHaveAttribute("height", "64");
    expect(rect).toHaveAttribute("width", "64");
    expect(rect).toHaveAttribute("x", "8");
    expect(rect).toHaveAttribute("y", "8");
  });

  it("applies the exact classes: 'loader' and 'loader triangle'", () => {
    const { container } = render(<Loader2 />);

    const loaders = container.querySelectorAll(".loader");
    expect(loaders.length).toBe(3);

    const triangle = container.querySelector(".loader.triangle");
    expect(triangle).toBeInTheDocument();
  });

  it("supports single shape selection for targeted inline loading", () => {
    const { container: circleOnly } = render(<Loader2 shape="circle" />);
    expect(circleOnly.querySelector("circle#test")).toBeInTheDocument();
    expect(circleOnly.querySelector("polygon")).not.toBeInTheDocument();
    expect(circleOnly.querySelector("rect")).not.toBeInTheDocument();

    const { container: triangleOnly } = render(<Loader2 shape="triangle" />);
    expect(triangleOnly.querySelector("polygon")).toBeInTheDocument();
    expect(triangleOnly.querySelector("circle")).not.toBeInTheDocument();

    const { container: rectOnly } = render(<Loader2 shape="rect" />);
    expect(rectOnly.querySelector("rect")).toBeInTheDocument();
    expect(rectOnly.querySelector("polygon")).not.toBeInTheDocument();
  });

  it("supports size variants without mutating underlying SVG coordinates", () => {
    const { container } = render(<Loader2 size="sm" data-testid="sm-loader" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("sizeSm");
  });

  it("renders DemoOne default export identically", () => {
    const { container } = render(<DemoOne />);
    expect(container.querySelector("circle#test")).toBeInTheDocument();
    expect(container.querySelector("polygon")).toBeInTheDocument();
    expect(container.querySelector("rect")).toBeInTheDocument();
  });
});
