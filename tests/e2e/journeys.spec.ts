import { expect, test, type Page } from "@playwright/test";

const TITLE = "Mock Tender for Automated Tests";

async function openSampleTender(page: Page) {
  await page.goto("/tenders/new");
  await page.getByRole("button", { name: "Use sample" }).first().click();
  await expect(page).toHaveURL(/\/tenders\/[0-9a-f-]{36}/);
  await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible({ timeout: 120_000 });
}

test.describe.configure({ mode: "serial" });

test("upload a tender and see the AI analysis", async ({ page }) => {
  await openSampleTender(page);
  await expect(page.getByText("critical finding could disqualify this bid")).toBeVisible();
  await page.getByRole("tab", { name: /Requirements/ }).click();
  await expect(page.getByText("Registered company")).toBeVisible();
});

test("mark checklist items as completed and keep progress", async ({ page }) => {
  await openSampleTender(page);
  await page.getByRole("tab", { name: /Compliance checklist/ }).click();
  const item = page.getByRole("checkbox", { name: "Submit company registration certificate" });
  await item.click();
  await expect(item).toBeChecked();
  await expect(page.getByText("50%").first()).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: /Compliance checklist/ }).click();
  await expect(page.getByRole("checkbox", { name: "Submit company registration certificate" })).toBeChecked();
});

test("ask the assistant and open the cited page", async ({ page }) => {
  await openSampleTender(page);
  await page.getByRole("tab", { name: "AI assistant" }).click();
  await page.getByRole("button", { name: "What is the submission deadline?" }).click();
  await expect(page.getByText("The submission deadline is 15 January 2030")).toBeVisible();

  await page.getByRole("button", { name: "Source 1: page 1" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("Source evidence")).toBeVisible();
  await expect(sheet.getByText("Smart Traffic Management", { exact: false }).or(sheet.locator("p").first())).toBeVisible();
});

test("dashboard and risk register reflect the analysis", async ({ page }) => {
  await openSampleTender(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bid portfolio" })).toBeVisible();
  await expect(page.getByText("Bid bond required").first()).toBeVisible();

  await page.getByRole("link", { name: /Risk register/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Risk register" })).toBeVisible();
  await page.getByRole("option", { name: /Budget not stated/ }).click();
  await expect(page.getByText("Ask a clarification question.")).toBeVisible();
});
