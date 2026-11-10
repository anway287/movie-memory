/**
 * Tests for the typed API client (lib/api.ts)
 * Focus: error normalization (401, 500) and successful responses.
 */

// Polyfill fetch for Jest
global.fetch = jest.fn();

import { apiClient } from "@/lib/api";
import type { ApiError } from "@/lib/api";

function mockFetch(status: number, body: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

function mockFetchNetworkError() {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Failed to fetch"));
}

describe("apiClient.getMe", () => {
  it("returns user data on 200", async () => {
    const user = { id: "1", name: "Alice", email: "a@example.com", image: null, favoriteMovie: "Inception", onboarded: true };
    mockFetch(200, user);

    const result = await apiClient.getMe();
    expect(result).toEqual(user);
  });

  it("throws ApiError with status 401 on unauthenticated", async () => {
    mockFetch(401, { error: "Unauthorized" });

    await expect(apiClient.getMe()).rejects.toMatchObject<Partial<ApiError>>({
      status: 401,
      error: "Unauthorized",
    });
  });

  it("throws ApiError with status 500 on server error", async () => {
    mockFetch(500, { error: "Internal Server Error" });

    await expect(apiClient.getMe()).rejects.toMatchObject<Partial<ApiError>>({
      status: 500,
    });
  });

  it("includes a default message when server returns non-JSON on error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => { throw new Error("not json"); },
    });

    await expect(apiClient.getMe()).rejects.toMatchObject<Partial<ApiError>>({
      status: 503,
      error: expect.stringContaining("503"),
    });
  });
});

describe("apiClient.updateMovie", () => {
  it("resolves with updated movie on success", async () => {
    mockFetch(200, { favoriteMovie: "The Godfather" });

    const result = await apiClient.updateMovie("The Godfather");
    expect(result.favoriteMovie).toBe("The Godfather");
  });

  it("throws ApiError on 422 validation error", async () => {
    mockFetch(422, { error: "Movie title is required" });

    await expect(apiClient.updateMovie("")).rejects.toMatchObject<Partial<ApiError>>({
      status: 422,
      error: "Movie title is required",
    });
  });

  it("throws ApiError on 401", async () => {
    mockFetch(401, { error: "Unauthorized" });

    await expect(apiClient.updateMovie("Test")).rejects.toMatchObject<Partial<ApiError>>({
      status: 401,
    });
  });
});

describe("apiClient.getFact", () => {
  it("returns a fact response on 200", async () => {
    const fact = { id: "f1", content: "Fun fact!", movie: "Inception", cached: false, createdAt: new Date().toISOString() };
    mockFetch(200, fact);

    const result = await apiClient.getFact();
    expect(result.content).toBe("Fun fact!");
    expect(result.cached).toBe(false);
  });

  it("throws ApiError on 503 (OpenAI down, no cache)", async () => {
    mockFetch(503, { error: "Could not generate a fact right now. Please try again later." });

    await expect(apiClient.getFact()).rejects.toMatchObject<Partial<ApiError>>({
      status: 503,
    });
  });

  it("throws ApiError on 401", async () => {
    mockFetch(401, { error: "Unauthorized" });

    await expect(apiClient.getFact()).rejects.toMatchObject<Partial<ApiError>>({
      status: 401,
    });
  });
});

describe("network failure handling", () => {
  it("propagates TypeError from fetch on network error", async () => {
    mockFetchNetworkError();
    await expect(apiClient.getMe()).rejects.toThrow(TypeError);
  });
});
