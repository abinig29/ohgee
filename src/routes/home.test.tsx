import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Home from "./home";

async function disagreeWith(name: string) {
  const user = userEvent.setup();
  const heading = screen.getByRole("heading", { name });
  const article = heading.closest("article") as HTMLElement;
  await user.click(within(article).getByRole("button", { name: "Disagree" }));

  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Disagree" }));
}

describe("the monitor page", () => {
  it("opens with the verdict and the flagged days", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Three days need a look." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orders spiked" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orders collapsed" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Value per order fell" })).toBeInTheDocument();
  });

  it("shows the evidence behind a finding on request", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const article = screen.getByRole("heading", { name: "Orders spiked" }).closest("article");
    await user.click(within(article as HTMLElement).getByRole("button", { name: /seven days/ }));

    expect(within(article as HTMLElement).getByText("Average of those 7")).toBeInTheDocument();
  });

  it("moves a finding to Dismissed when the owner disagrees", async () => {
    render(<Home />);

    await disagreeWith("Orders spiked");

    expect(screen.queryByRole("heading", { name: "Orders spiked" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Show dismissed \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Two days need a look." })).toBeInTheDocument();
  });

  it("restores a dismissed finding to the active list", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await disagreeWith("Orders spiked");

    await user.click(screen.getByRole("button", { name: /Show dismissed/ }));
    await user.click(screen.getByRole("button", { name: "Restore" }));

    expect(screen.getByRole("heading", { name: "Orders spiked" })).toBeInTheDocument();
  });

  it("clears every dismissal at once", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await disagreeWith("Orders spiked");
    await disagreeWith("Orders collapsed");

    await user.click(screen.getByRole("button", { name: /Show dismissed \(2\)/ }));
    await user.click(screen.getByRole("button", { name: "Clear all dismissals" }));

    expect(screen.getByRole("heading", { name: "Orders spiked" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orders collapsed" })).toBeInTheDocument();
  });

  it("opens the day in full when a finding is selected", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const article = screen.getByRole("heading", { name: "Orders spiked" }).closest("article");
    await user.click(within(article as HTMLElement).getByRole("button", { name: /High/ }));

    expect(screen.getByRole("heading", { name: /07 Mar/ })).toBeInTheDocument();
    expect(screen.getByText("The days either side")).toBeInTheDocument();
  });
});
