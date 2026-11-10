/**
 * Typed API client for Movie Memory.
 * All requests go through here for consistent error handling and response parsing.
 */

export type ApiError = {
  error: string;
  status: number;
};

export type MeResponse = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  favoriteMovie: string | null;
  onboarded: boolean;
};

export type UpdateMovieRequest = {
  movie: string;
};

export type UpdateMovieResponse = {
  favoriteMovie: string;
};

export type FactResponse = {
  id: string;
  content: string;
  movie: string;
  cached: boolean;
  createdAt: string;
};

class ApiClient {
  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      try {
        const body = await res.json();
        message = body.error ?? message;
      } catch {
        // non-JSON error body — keep default message
      }
      const err: ApiError = { error: message, status: res.status };
      throw err;
    }

    return res.json() as Promise<T>;
  }

  getMe(): Promise<MeResponse> {
    return this.request<MeResponse>("/api/me");
  }

  updateMovie(movie: string): Promise<UpdateMovieResponse> {
    return this.request<UpdateMovieResponse>("/api/me/movie", {
      method: "PUT",
      body: JSON.stringify({ movie } satisfies UpdateMovieRequest),
    });
  }

  getFact(): Promise<FactResponse> {
    return this.request<FactResponse>("/api/fact");
  }
}

export const apiClient = new ApiClient();
