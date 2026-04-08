import { api, ApiError } from "@/lib/api";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("api()", () => {
  it("makes a GET request to the correct URL", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ data: "test" }),
    });

    const result = await api("/api/items/");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/items/",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual({ data: "test" });
  });

  it("appends query params, filtering out null/undefined/empty", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve([]),
    });

    await api("/api/items/", {
      params: { page: 2, page_size: 10, search: "", filter: undefined, extra: null },
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("page=2");
    expect(calledUrl).toContain("page_size=10");
    expect(calledUrl).not.toContain("search");
    expect(calledUrl).not.toContain("filter");
    expect(calledUrl).not.toContain("extra");
  });

  it("sends Authorization header when token provided", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    });

    await api("/api/auth/me", { token: "abc123" });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Authorization"]).toBe("Bearer abc123");
  });

  it("does not send Authorization header when token is null", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    });

    await api("/api/items/", { token: null });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("sends JSON body with Content-Type header for POST", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ id: 1 }),
    });

    await api("/api/auth/login", {
      method: "POST",
      body: { email: "a@b.com", password: "pass" },
    });

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(opts.body).toBe(JSON.stringify({ email: "a@b.com", password: "pass" }));
  });

  it("sends FormData without Content-Type header", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({}),
    });

    const fd = new FormData();
    fd.append("name", "test");

    await api("/api/items/enroll", { method: "POST", formData: fd });

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["Content-Type"]).toBeUndefined();
    expect(opts.body).toBe(fd);
  });

  it("throws ApiError with status and detail on non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ detail: "Invalid credentials" }),
    });

    await expect(api("/api/auth/login")).rejects.toThrow(ApiError);

    try {
      await api("/api/auth/login");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(401);
      expect((err as ApiError).detail).toBe("Invalid credentials");
    }
  });

  it("falls back to statusText when response body is not JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("not json")),
    });

    try {
      await api("/api/items/");
    } catch (err) {
      expect((err as ApiError).detail).toBe("Internal Server Error");
    }
  });

  it("returns undefined for non-JSON success responses", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/plain" }),
    });

    const result = await api("/api/sessions/1/close-image");
    expect(result).toBeUndefined();
  });

  it("uses PATCH method correctly", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ id: 1, quantity: 5 }),
    });

    await api("/api/items/1/quantity", {
      method: "PATCH",
      body: { delta: 3 },
      token: "tok",
    });

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe("PATCH");
  });
});

describe("ApiError", () => {
  it("has correct name, status, and detail properties", () => {
    const err = new ApiError(404, "Not found");
    expect(err.name).toBe("ApiError");
    expect(err.status).toBe(404);
    expect(err.detail).toBe("Not found");
    expect(err.message).toBe("Not found");
    expect(err).toBeInstanceOf(Error);
  });
});
