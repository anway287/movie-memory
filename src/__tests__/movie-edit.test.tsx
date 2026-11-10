/**
 * Tests for the movie edit flow in DashboardClient.
 * Focus: optimistic update, revert on failure, loading states.
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock the api module
jest.mock("@/lib/api", () => ({
  apiClient: {
    updateMovie: jest.fn(),
    getFact: jest.fn(),
  },
}));

import DashboardClient from "@/components/DashboardClient";
import { apiClient } from "@/lib/api";

const mockUpdateMovie = apiClient.updateMovie as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Movie inline edit flow", () => {
  it("renders the initial movie title", () => {
    render(<DashboardClient initialMovie="Inception" />);
    // "Inception" appears in the title span and in the fact blurb — use getAllByText
    expect(screen.getAllByText("Inception").length).toBeGreaterThanOrEqual(1);
  });

  it("shows edit input after clicking Edit", async () => {
    render(<DashboardClient initialMovie="Inception" />);
    await userEvent.click(screen.getByText("Edit"));
    expect(screen.getByDisplayValue("Inception")).toBeInTheDocument();
  });

  it("optimistically updates movie title before server confirms", async () => {
    // Keep the promise pending so we can observe the optimistic state
    let resolveUpdate!: (v: { favoriteMovie: string }) => void;
    mockUpdateMovie.mockReturnValue(
      new Promise<{ favoriteMovie: string }>((res) => { resolveUpdate = res; })
    );

    render(<DashboardClient initialMovie="Inception" />);
    await userEvent.click(screen.getByText("Edit"));

    const input = screen.getByDisplayValue("Inception");
    await userEvent.clear(input);
    await userEvent.type(input, "The Godfather");
    await userEvent.click(screen.getByText("Save"));

    // Optimistic update should be visible immediately
    expect(screen.getByText("The Godfather")).toBeInTheDocument();

    // Resolve the server call
    act(() => resolveUpdate({ favoriteMovie: "The Godfather" }));

    await waitFor(() => expect(screen.queryByDisplayValue("The Godfather")).not.toBeInTheDocument());
  });

  it("reverts to original movie title when server returns an error", async () => {
    mockUpdateMovie.mockRejectedValueOnce({ status: 500, error: "Server error" });

    render(<DashboardClient initialMovie="Inception" />);
    await userEvent.click(screen.getByText("Edit"));

    const input = screen.getByDisplayValue("Inception");
    await userEvent.clear(input);
    await userEvent.type(input, "Bad Movie");
    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      // After revert, the original title should be displayed
      expect(screen.getByText("Inception")).toBeInTheDocument();
    });
  });

  it("shows error message after server failure", async () => {
    mockUpdateMovie.mockRejectedValueOnce({ status: 500, error: "Server error" });

    render(<DashboardClient initialMovie="Inception" />);
    await userEvent.click(screen.getByText("Edit"));

    const input = screen.getByDisplayValue("Inception");
    await userEvent.clear(input);
    await userEvent.type(input, "Bad Movie");
    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });

  it("cancels edit without changing the movie title", async () => {
    render(<DashboardClient initialMovie="Inception" />);
    await userEvent.click(screen.getByText("Edit"));

    const input = screen.getByDisplayValue("Inception");
    await userEvent.clear(input);
    await userEvent.type(input, "Some Other Movie");
    await userEvent.click(screen.getByText("Cancel"));

    // The title span (not the fact blurb) should still show Inception
    expect(screen.getAllByText("Inception").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByDisplayValue("Some Other Movie")).not.toBeInTheDocument();
  });

  it("does not call the API if the movie title is unchanged", async () => {
    render(<DashboardClient initialMovie="Inception" />);
    await userEvent.click(screen.getByText("Edit"));

    // Don't change anything, just save
    await userEvent.click(screen.getByText("Save"));

    expect(mockUpdateMovie).not.toHaveBeenCalled();
  });
});
