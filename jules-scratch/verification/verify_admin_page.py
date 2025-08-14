import re
from playwright.sync_api import Page, expect

def test_admin_page(page: Page):
    # 1. Arrange: Go to the login page and log in.
    page.goto("http://localhost:4200/login")
    page.get_by_label("Email").fill("test@test.com")
    page.get_by_label("Password").fill("password")
    page.get_by_role("button", name="Sign In").click()

    # 2. Act: Navigate to the "Admin" page.
    page.get_by_role("link", name="Admin").click()

    # 3. Assert: Check that the "Admin" page is loaded.
    expect(page).to_have_url("http://localhost:4200/admin")
    expect(page.get_by_role("heading", name="Admin Panel")).to_be_visible()

    # 4. Act: Click the "Update Winners" button.
    page.get_by_role("button", name="Update Winners").click()

    # 5. Assert: Check that the success message is displayed.
    expect(page.get_by_text(re.compile("Successfully updated .* games."))).to_be_visible()

    # 6. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/verification.png")
