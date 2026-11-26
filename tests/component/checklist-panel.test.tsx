// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChecklistPanel, type ChecklistItemView } from "@/features/checklist/components/checklist-panel";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

const items: ChecklistItemView[] = [
  { id: "a", category: "eligibility", requirement: "Submit registration", guidance: "Attach it", mandatory: true, priority: "high", pages: [1], completed: false },
  { id: "b", category: "technical", requirement: "Provide architecture", guidance: "Diagram", mandatory: false, priority: "low", pages: [2], completed: true },
];

afterEach(() => vi.unstubAllGlobals());

describe("ChecklistPanel", () => {
  it("shows progress and persists a toggle", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ completed: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ChecklistPanel tenderId="t1" initialItems={items} />);

    expect(screen.getByText("50%")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: "Submit registration" }));

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/tenders/t1/checklist/a", expect.objectContaining({ method: "PATCH" }));
  });

  it("rolls back the optimistic update when saving fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "x", message: "Nope" } }), { status: 500 })),
    );
    render(<ChecklistPanel tenderId="t1" initialItems={items} />);
    const checkbox = screen.getByRole("checkbox", { name: "Submit registration" });
    await userEvent.click(checkbox);
    await waitFor(() => expect(checkbox).not.toBeChecked());
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("filters to open items", async () => {
    render(<ChecklistPanel tenderId="t1" initialItems={items} />);
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    expect(screen.queryByText("Provide architecture")).not.toBeInTheDocument();
    expect(screen.getByText("Submit registration")).toBeInTheDocument();
  });
});
