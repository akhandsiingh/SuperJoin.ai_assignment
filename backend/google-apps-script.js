

const WEBHOOK_URL = 'http://localhost:3001/sheet/webhook'; // Change to your backend URL
const SHEET_NAME = 'Data'; // Change to your sheet name


function onEdit(e) {
  if (!e || !e.range) {
    console.log('[onEdit] Invalid event');
    return;
  }

  try {
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    const sheetName = sheet.getName();

    // Skip if editing on different sheet
    if (sheetName !== SHEET_NAME) {
      console.log(`[onEdit] Skipping different sheet: ${sheetName}`);
      return;
    }

    // Skip header row
    if (range.getRow() === 1) {
      console.log('[onEdit] Skipping header row');
      return;
    }

    const payload = {
      row: range.getRow(),
      column: range.getColumn(),
      oldValue: e.oldValue || null,
      newValue: e.value || null,
      sheetName: sheetName,
      user: google.script.run.withSuccessHandler(function(email) {
        console.log('User email:', email);
        return email;
      }).getActiveUserEmail(),
      timestamp: new Date().toISOString(),
    };

    console.log('[onEdit] Payload:', JSON.stringify(payload));

    // Send to webhook
    const response = sendWebhook(payload);
    console.log('[onEdit] Response:', response);
  } catch (error) {
    console.error('[onEdit] Error:', error.toString());
    // Silently fail - don't break user experience
  }
}

/**
 * Send webhook to backend
 */
function sendWebhook(payload) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const status = response.getResponseCode();
    const result = response.getContentText();

    console.log(`[sendWebhook] Status: ${status}, Response: ${result}`);

    if (status === 200 || status === 201) {
      return { success: true, status, result: JSON.parse(result) };
    } else {
      return { success: false, status, error: result };
    }
  } catch (error) {
    console.error('[sendWebhook] Error:', error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Optional: Create a menu to manually trigger sync
 */
function onOpen(e) {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Sync')
    .addItem('Test Connection', 'testConnection')
    .addSeparator()
    .addItem('View Sync Status', 'viewSyncStatus')
    .addToUi();
}

/**
 * Test webhook connection
 */
function testConnection() {
  const testPayload = {
    row: 2,
    column: 2,
    oldValue: 'Test',
    newValue: 'Test Connection',
    sheetName: SHEET_NAME,
    timestamp: new Date().toISOString(),
  };

  const response = sendWebhook(testPayload);

  if (response.success) {
    SpreadsheetApp.getUi().alert(
      'Connection successful!\n\n' +
        'Webhook URL: ' +
        WEBHOOK_URL +
        '\n\nResponse: ' +
        JSON.stringify(response.result),
    );
  } else {
    SpreadsheetApp.getUi().alert(
      'Connection failed!\n\nError: ' + response.error,
    );
  }
}

/**
 * View sync status (opens browser tab)
 */
function viewSyncStatus() {
  const statusUrl = WEBHOOK_URL.replace('/sheet/webhook', '/sync/status');
  SpreadsheetApp.getUi().showModelessDialog(
    HtmlService.createHtmlOutput(
      '<script>window.location.href = "' +
        statusUrl +
        '";</script><p>Opening sync status...</p>',
    ),
    'Sync Status',
  );
}

function getActiveUserEmail() {
  return Session.getActiveUser().getEmail();
}
