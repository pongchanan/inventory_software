import {
  createItem,
  fetchItemByUid,
  fetchItems,
  getImageUrl,
  login,
} from "./api";

describe("api client facade", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("fetchItems maps canonical item-types to Item contract", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 3,
            name: "Screwdriver",
            is_active: true,
            quantity: 1,
            image: "/img/a.png",
            created_at: "2026-03-10T00:00:00.000Z",
            updated_at: "2026-03-10T00:00:00.000Z",
          },
        ],
        total: 1,
        page: 1,
      }),
    });

    const items = await fetchItems();

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/api/items/", { cache: "no-store" });
    expect(items).toEqual([
      {
        id: 3,
        uid: "TYPE-3",
        name: "Screwdriver",
        description: null,
        category: "item-type",
        quantity: 1,
        available: true,
        location: null,
        image_url: "/img/a.png",
        created_at: "2026-03-10T00:00:00.000Z",
        updated_at: "2026-03-10T00:00:00.000Z",
      },
    ]);
  });

  test("fetchItemByUid throws when backend does not return item", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    await expect(fetchItemByUid("TYPE-999")).rejects.toThrow("Item not found");
  });

  test("createItem keeps error semantics", async () => {
    await expect(createItem({ uid: "A", name: "A" })).rejects.toThrow(
      "not yet implemented in backend"
    );
  });

  test("login keeps error semantics", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "invalid" }),
    });

    await expect(login("x@y.com", "bad")).rejects.toThrow("invalid");
  });

  test("getImageUrl keeps placeholder behavior", () => {
    expect(getImageUrl(null)).toBe("/placeholder.png");
    expect(getImageUrl("https://cdn/x.png")).toBe("https://cdn/x.png");
    expect(getImageUrl("img.png")).toBe("http://localhost:8000/img.png");
  });
});
