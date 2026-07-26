import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { clearSessionCache } from "./session-cache";

describe("clearSessionCache", () => {
  it("removes cached queries from the client", () => {
    const client = new QueryClient();
    client.setQueryData(["notes", "all", ""], { results: [{ id: 1 }] });
    client.setQueryData(["me"], { user: { id: 1, email: "a@x.com" } });

    clearSessionCache(client);

    expect(client.getQueryData(["notes", "all", ""])).toBeUndefined();
    expect(client.getQueryData(["me"])).toBeUndefined();
  });
});
