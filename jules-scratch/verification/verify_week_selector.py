from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to Games page
    page.goto("http://localhost:4200/games")

    # Wait for the week selector to be visible
    week_selector = page.locator("app-week-selector")
    expect(week_selector).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/games-view.png")

    # Navigate to Leaderboard page
    page.goto("http://localhost:4200/leaderboard")

    # Wait for the week selector to be visible
    expect(week_selector).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/leaderboard-view.png")

    browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
