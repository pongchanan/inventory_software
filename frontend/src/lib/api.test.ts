import {
  createItem,
  fetchItemByUid,
  fetchItems,
  getImageUrl,
  login,
} from "./api";

describe("api client facade", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetchItems maps canonical item-types to Item contract", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 3,
          name: "Screwdriver",
          active: true,
          created_at: "2026-03-10T00:00:00.000Z",
          updated_at: "2026-03-10T00:00:00.000Z",
          images: [{ id: 1, item_type_id: 3, image_url: "/img/a.png", is_primary: true }],
        },
      ],
    });

    const items = await fetchItems();

    expect(global.fetch).toHaveBeenCalledWith("/api/item-types", { cache: "no-store" });
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
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "dup" }),
    });

    await expect(createItem({ uid: "A", name: "A" })).rejects.toThrow("dup");
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
    expect(getImageUrl("img.png")).toBe("/img.png");
  });
});
