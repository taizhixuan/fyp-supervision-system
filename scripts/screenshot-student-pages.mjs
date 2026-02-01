import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, '..', 'screenshots', 'student');

const BASE_URL = 'http://localhost:3000';

// All student routes (excluding parameterized :id routes that need real data)
const STUDENT_PAGES = [
  { name: '01-dashboard', path: '/student/dashboard', title: 'Student Dashboard' },
  { name: '02-profile', path: '/student/profile', title: 'Student Profile' },
  { name: '03-supervisors', path: '/student/supervisors', title: 'Supervisors Directory' },
  { name: '04-recommendations', path: '/student/recommendations', title: 'AI Recommendations' },
  { name: '05-compare-supervisors', path: '/student/supervisors/compare', title: 'Compare Supervisors' },
  { name: '06-create-request', path: '/student/request/new', title: 'Create Supervision Request' },
  { name: '07-my-requests', path: '/student/requests', title: 'My Requests' },
  { name: '08-proposal', path: '/student/proposal', title: 'Proposal Workspace' },
  { name: '09-proposal-history', path: '/student/proposal/history', title: 'Proposal History' },
  { name: '10-proposal-analysis', path: '/student/proposal/analysis', title: 'Proposal Analysis' },
  { name: '11-proposal-status', path: '/student/proposal/status', title: 'Proposal Status' },
  { name: '12-registration', path: '/student/registration', title: 'Registration Status' },
  { name: '13-meetings', path: '/student/meetings', title: 'Meetings List' },
  { name: '14-meeting-new', path: '/student/meetings/new', title: 'New Meeting Request' },
  { name: '15-meeting-export', path: '/student/meetings/export', title: 'Meeting Export' },
  { name: '16-logs', path: '/student/logs', title: 'Supervision Logs' },
  { name: '17-log-new', path: '/student/logs/new', title: 'Create New Log' },
  { name: '18-documents', path: '/student/documents', title: 'Documents List' },
  { name: '19-document-upload', path: '/student/documents/upload', title: 'Upload Document' },
  { name: '20-resources', path: '/student/resources', title: 'Resources Hub' },
  { name: '21-deadlines', path: '/student/deadlines', title: 'Deadline Calendar' },
  { name: '22-notifications', path: '/student/notifications', title: 'Notification Center' },
  { name: '23-notification-settings', path: '/student/notifications/settings', title: 'Notification Settings' },
  { name: '24-chatbot', path: '/student/chatbot', title: 'AI Chatbot' },
];

async function captureScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Step 1: Set mock auth role to student
  console.log('Setting up mock student authentication...');
  await page.goto(`${BASE_URL}/?role=student`);
  await page.waitForTimeout(2000); // Wait for auth context to initialize

  // Verify we're authenticated by checking for redirect to dashboard
  const url = page.url();
  console.log(`After auth setup, current URL: ${url}`);

  // Step 2: Screenshot each student page
  for (const route of STUDENT_PAGES) {
    const fullUrl = `${BASE_URL}${route.path}`;
    console.log(`Capturing: ${route.title} (${route.path})`);

    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000); // Extra time for animations/rendering

      const screenshotPath = path.join(screenshotDir, `${route.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
      });
      console.log(`  ✓ Saved: ${route.name}.png`);
    } catch (err) {
      console.error(`  ✗ Failed: ${route.title} - ${err.message}`);
      // Try to take screenshot anyway
      try {
        const screenshotPath = path.join(screenshotDir, `${route.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`  ✓ Saved (with timeout): ${route.name}.png`);
      } catch (ssErr) {
        console.error(`  ✗ Screenshot also failed: ${ssErr.message}`);
      }
    }
  }

  console.log('\nDone! Closing browser...');
  await browser.close();
  console.log(`Screenshots saved to: ${screenshotDir}`);
}

captureScreenshots().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
