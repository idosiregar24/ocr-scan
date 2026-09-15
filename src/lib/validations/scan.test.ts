import { describe, expect, it } from "vitest";
import { scanUploadSchema } from "./scan";

function makeFile(bytes: number, type: string) {
  return new File([new Uint8Array(bytes)], "struk.jpg", { type });
}

describe("scanUploadSchema", () => {
  it("menerima foto JPG di bawah batas ukuran", () => {
    const result = scanUploadSchema.safeParse({ image: makeFile(1024, "image/jpeg") });
    expect(result.success).toBe(true);
  });

  it("menolak foto di atas 10MB", () => {
    const result = scanUploadSchema.safeParse({ image: makeFile(11 * 1024 * 1024, "image/jpeg") });
    expect(result.success).toBe(false);
  });

  it("menolak MIME type selain gambar yang didukung", () => {
    const result = scanUploadSchema.safeParse({ image: makeFile(1024, "application/pdf") });
    expect(result.success).toBe(false);
  });
});
