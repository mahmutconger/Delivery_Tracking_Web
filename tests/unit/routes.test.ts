import { describe, expect, it } from "vitest";

import { canTransitionRouteStatus } from "@/features/routes/domain/models";

describe("route status transitions", () => {
  it("allows expected forward transitions", () => {
    expect(canTransitionRouteStatus("draft", "assigned")).toBe(true);
    expect(canTransitionRouteStatus("assigned", "in_progress")).toBe(true);
    expect(canTransitionRouteStatus("in_progress", "completed")).toBe(true);
  });

  it("blocks unexpected transitions", () => {
    expect(canTransitionRouteStatus("draft", "completed")).toBe(false);
    expect(canTransitionRouteStatus("completed", "draft")).toBe(false);
    expect(canTransitionRouteStatus("cancelled", "assigned")).toBe(false);
  });
});
