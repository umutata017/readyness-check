import { describe, expect, it } from "vitest";
import { fitWithin } from "./images";

describe("photo resizing", () => {
  it("scales the longest side down to 2000 px", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1500, height: 2000 });
  });

  it("never enlarges a small photo", () => {
    expect(fitWithin(1200, 900)).toEqual({ width: 1200, height: 900 });
  });
});
