"""
Usability evaluation driver for the FYP Supervision System.

Drives the running app (frontend :5173 + backend :8080 + AI :5001-5003) through
the Chapter 6.4 task list with Selenium, captures a screenshot per task screen,
and records the automated load time and reach/complete status to results.csv.

This is an EXPERT/HEURISTIC evaluation aid: the script reproduces the task flows
and produces the figures + objective timing. The usability verdict per screen
(heuristic violations, severity) is the evaluator's judgement, written up in
chapter6.md -- the script does not invent human reactions.

Run (app must be up):
    cd scripts/usability
    python usability_eval.py            # headless
    python usability_eval.py --headed   # watch it drive

Selenium 4.6+ ships Selenium Manager, so no manual chromedriver install is needed.
"""

import argparse
import csv
import os
import sys
import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE = os.environ.get("APP_BASE_URL", "http://localhost:5173")
OUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "docs-project", "report", "test-evidence")
)

PASSWORD = "Test@123"
ADMIN_PASSWORD = "Admin@123"

ACCOUNTS = {
    "student": ("sophia@student.mmu.edu.my", PASSWORD),
    "supervisor": ("tan.weiming@mmu.edu.my", PASSWORD),
    "committee": ("ahmad.razak@mmu.edu.my", PASSWORD),
    "admin": ("admin@mmu.edu.my", ADMIN_PASSWORD),
}

results = []
counter = {"n": 0}


def make_driver(headed: bool) -> webdriver.Chrome:
    opts = Options()
    if not headed:
        opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1440,1000")
    opts.add_argument("--force-device-scale-factor=1")
    opts.add_argument("--hide-scrollbars")
    opts.add_argument("--lang=en-US")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    driver = webdriver.Chrome(options=opts)
    driver.set_page_load_timeout(40)
    # Force light theme for print-friendly figures: the app theme defaults to
    # 'system', which resolves via prefers-color-scheme (dark in headless Chrome).
    driver.execute_cdp_cmd(
        "Emulation.setEmulatedMedia",
        {"media": "screen", "features": [{"name": "prefers-color-scheme", "value": "light"}]},
    )
    return driver


def heal_vite(driver) -> None:
    """Dev-only: a stale Vite dynamic-import chunk shows an error boundary; reload clears it."""
    try:
        if "Unexpected Application Error" in driver.page_source or "Failed to fetch dynamically" in driver.page_source:
            driver.refresh()
            time.sleep(2.5)
    except Exception:
        pass


def dismiss_pdpa(driver) -> None:
    """Supervisor/committee/admin hit a PDPA 'Privacy Notice updated' consent modal after login."""
    try:
        btn = WebDriverWait(driver, 3).until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(normalize-space(.),'Accept and continue')]")
            )
        )
        try:
            cb = driver.find_element(By.XPATH, "//input[@type='checkbox']")
            if not cb.is_selected():
                driver.execute_script("arguments[0].click();", cb)
        except Exception:
            pass
        driver.execute_script("arguments[0].click();", btn)
        time.sleep(1.5)
    except Exception:
        pass  # no modal -> fine


def login(driver, email: str, password: str) -> None:
    driver.get(BASE + "/login")
    driver.execute_script("window.localStorage.clear();")
    driver.execute_script("window.localStorage.setItem('theme','light');")
    driver.get(BASE + "/login")
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    pwd = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    inputs = driver.find_elements(By.CSS_SELECTOR, "input")
    email_box = None
    for el in inputs:
        if (el.get_attribute("type") or "text") != "password":
            email_box = el
            break
    for box, val in ((email_box, email), (pwd, password)):
        box.click()
        box.send_keys(Keys.CONTROL, "a")
        box.send_keys(Keys.DELETE)
        box.send_keys(val)
    driver.find_element(
        By.XPATH, "//button[contains(normalize-space(.),'Log In') or contains(normalize-space(.),'Login')]"
    ).click()
    WebDriverWait(driver, 20).until(lambda d: "/login" not in d.current_url)
    time.sleep(1.5)
    dismiss_pdpa(driver)


def capture(driver, slug, role, task, heuristic, url=None, wait=None, settle=2.0, pre=None):
    """Navigate (optional), run an optional pre() action, wait, screenshot, record."""
    t0 = time.time()
    if url is not None:
        driver.get(BASE + url)
        heal_vite(driver)
    try:
        WebDriverWait(driver, 25).until(
            EC.any_of(
                EC.presence_of_element_located((By.TAG_NAME, "h1")),
                EC.presence_of_element_located((By.TAG_NAME, "h2")),
                EC.presence_of_element_located((By.CSS_SELECTOR, "main")),
            )
        )
    except Exception:
        pass
    if pre is not None:
        try:
            pre(driver)
        except Exception as e:
            print(f"  ! pre() failed for {slug}: {e}")
    time.sleep(settle)
    elapsed = round(time.time() - t0, 2)
    counter["n"] += 1
    num = f"{counter['n']:02d}"
    fname = f"fig6-{num}-{slug}.png"
    driver.save_screenshot(os.path.join(OUT_DIR, fname))
    results.append(
        {
            "fig": f"6.{counter['n']}",
            "file": fname,
            "role": role,
            "task": task,
            "heuristic_focus": heuristic,
            "auto_load_s": elapsed,
            "url": driver.current_url.replace(BASE, ""),
        }
    )
    print(f"  [{num}] {role:10s} {task:40s} {elapsed:5.2f}s  {fname}")


# ---- per-task pre() actions -------------------------------------------------

def search_cyber(driver):
    box = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable(
            (By.XPATH, "//input[contains(@placeholder,'Search by name') or contains(@placeholder,'research area')]")
        )
    )
    box.click()
    box.send_keys("Cybersecurity")
    time.sleep(1.5)


def ask_chatbot(driver):
    box = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable(
            (By.XPATH, "//textarea[contains(@placeholder,'Ask anything')] | //input[contains(@placeholder,'Ask anything')]")
        )
    )
    box.click()
    box.send_keys("When is the FYP1 proposal due?")
    box.send_keys(Keys.RETURN)
    time.sleep(7)  # RAG round-trip (port 5003)


# ---- run --------------------------------------------------------------------

def run(headed: bool):
    os.makedirs(OUT_DIR, exist_ok=True)
    driver = make_driver(headed)
    try:
        # Login page itself (T1 start)
        driver.get(BASE + "/login")
        driver.execute_script("window.localStorage.setItem('theme','light');")
        driver.get(BASE + "/login")
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
        )
        capture(driver, "login", "all", "T1 Log in (entry screen)", "H2 match real world; H4 consistency", settle=1.2)

        # ---------------- STUDENT ----------------
        print("STUDENT")
        login(driver, *ACCOUNTS["student"])
        capture(driver, "student-dashboard", "student", "T1/T6 Student dashboard", "H1 visibility of system status", url="/student/dashboard")
        capture(driver, "find-supervisor", "student", "T2 Find a supervisor", "H6 recognition rather than recall", url="/student/supervisors")
        capture(driver, "find-supervisor-search", "student", "T2 Filter directory by expertise", "H1 visibility; H7 flexibility", url="/student/supervisors", pre=search_cyber)
        capture(driver, "ai-recommendations", "student", "T2 AI supervisor recommendation", "H1 visibility; H10 help/docs", url="/student/recommendations", settle=3.5)
        capture(driver, "chatbot", "student", "T7 Ask the FYP chatbot", "H1 visibility; H10 help/docs", url="/student/chatbot", pre=ask_chatbot, settle=1.0)
        capture(driver, "proposal-analysis", "student", "Proposal AI rubric scoring", "H1 visibility; H8 minimalist", url="/student/proposal/analysis", settle=3.0)
        capture(driver, "meeting-book", "student", "T3 Book a meeting slot", "H3 user control; H5 error prevention", url="/student/meetings/new", settle=2.5)
        capture(driver, "meeting-log-create", "student", "T4 Create + sign a meeting log", "H6 recognition (signature pad)", url="/student/meeting-logs/new", settle=2.5)
        capture(driver, "meeting-log-list", "student", "T5 Export signed meeting log (DOCX)", "H4 consistency; H8 minimalist", url="/student/meeting-logs")

        # ---------------- SUPERVISOR ----------------
        print("SUPERVISOR")
        login(driver, *ACCOUNTS["supervisor"])
        capture(driver, "supervisor-dashboard", "supervisor", "T6 Supervisor dashboard", "H1 visibility; H8 minimalist", url="/supervisor/dashboard")
        capture(driver, "supervisees", "supervisor", "Review supervisee panel", "H7 flexibility; H4 consistency", url="/supervisor/supervisees")
        capture(driver, "availability", "supervisor", "Publish weekly availability", "H5 error prevention; H3 user control", url="/supervisor/availability")
        capture(driver, "meeting-log-review", "supervisor", "Review/sign meeting logs", "H1 visibility; H6 recognition", url="/supervisor/meeting-logs")

        # ---------------- COMMITTEE ----------------
        print("COMMITTEE")
        login(driver, *ACCOUNTS["committee"])
        capture(driver, "committee-dashboard", "committee", "T6 Committee dashboard", "H1 visibility of system status", url="/committee/dashboard")
        capture(driver, "committee-projects", "committee", "Project & risk overview", "H4 consistency; colour coding", url="/committee/projects", settle=2.5)
        capture(driver, "committee-reports", "committee", "Cohort report + CSV export", "H7 flexibility; H8 minimalist", url="/committee/reports", settle=2.5)

        # ---------------- ADMIN ----------------
        print("ADMIN")
        login(driver, *ACCOUNTS["admin"])
        capture(driver, "admin-dashboard", "admin", "T6 Admin dashboard", "H1 visibility of system status", url="/admin/dashboard")
        capture(driver, "admin-users", "admin", "User roster management", "H7 flexibility; H4 consistency", url="/admin/users", settle=2.5)
        capture(driver, "admin-parameters", "admin", "Edit system parameters", "H5 error prevention; H9 error recovery", url="/admin/parameters", settle=2.5)
        capture(driver, "admin-audit", "admin", "Inspect audit log", "H1 visibility; H10 help/docs", url="/admin/audit-logs", settle=2.5)

    finally:
        # write results
        csv_path = os.path.join(OUT_DIR, "results.csv")
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(
                f, fieldnames=["fig", "file", "role", "task", "heuristic_focus", "auto_load_s", "url"]
            )
            w.writeheader()
            w.writerows(results)
        print(f"\nWrote {len(results)} figures + results.csv to {OUT_DIR}")
        driver.quit()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--headed", action="store_true", help="show the browser window")
    args = ap.parse_args()
    run(args.headed)
