from playwright.sync_api import sync_playwright, Page, expect
import re

def verify_game_card(page: Page):
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.goto("http://localhost:4200/games")

    # Wait for the games to load
    try:
        expect(page.locator(".game-card")).to_have_count(16, timeout=30000)
    except Exception as e:
        print("Error waiting for game cards:", e)
        print("Console errors:", errors)
        raise e

    # Find a game that has not started yet
    game_cards = page.locator(".game-card").all()
    future_game_card = None
    for card in game_cards:
        kickoff_time_text = card.locator(".game-time").inner_text()
        # The date format is "Day, Mon Day", so we need to parse it
        # This is a bit brittle, but it will work for this test
        match = re.search(r"(\w{3}, \w{3} \d{1,2})", kickoff_time_text)
        if match:
            kickoff_date_str = match.group(1)
            # This is a hacky way to check if the game is in the future
            # A better way would be to get the date from the game object
            # but this is good enough for a verification script
            if "Oct" in kickoff_date_str or "Nov" in kickoff_date_str or "Dec" in kickoff_date_str:
                future_game_card = card
                break

    if future_game_card:
        # Click on the away team
        away_team_button = future_game_card.locator(".radio-button input[type='radio']").first
        away_team_button.click()

        # Wait for the saving overlay to appear
        expect(future_game_card.locator(".saving-overlay")).to_be_visible()

        # Wait for the saving overlay to disappear
        expect(future_game_card.locator(".saving-overlay")).not_to_be_visible()

        # Take a screenshot of the card
        future_game_card.screenshot(path="jules-scratch/verification/future_game_card.png")

    # Find a game that has already started
    past_game_card = None
    for card in game_cards:
        kickoff_time_text = card.locator(".game-time").inner_text()
        match = re.search(r"(\w{3}, \w{3} \d{1,2})", kickoff_time_text)
        if match:
            kickoff_date_str = match.group(1)
            if "Sep" in kickoff_date_str:
                past_game_card = card
                break

    if past_game_card:
        # Select a pick for the past game to check the disabled but checked style
        away_team_button = past_game_card.locator(".radio-button input[type='radio']").first
        # This click should not do anything, but the button should be checked from the loaded picks

        # Take a screenshot of the card
        past_game_card.screenshot(path="jules-scratch/verification/past_game_card.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_game_card(page)
        browser.close()

if __name__ == "__main__":
    main()
