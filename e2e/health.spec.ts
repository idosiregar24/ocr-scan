import { test, expect } from "@playwright/test";

test("landing page menampilkan CTA utama", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Mulai Gratis" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Masuk" })).toBeVisible();
});

test("/api/health mengembalikan status ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe("ok");
});

test("route dashboard redirect ke /login untuk user belum login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
