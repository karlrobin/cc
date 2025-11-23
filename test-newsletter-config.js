/**
 * Diagnostic script to test newsletter configuration
 * Run with: node test-newsletter-config.js
 *
 * Make sure your .env file has:
 * - PUBLIC_DIRECTUS_URL
 * - DIRECTUS_ADMIN_TOKEN
 * - MAILGUN_API_KEY
 * - MAILGUN_DOMAIN
 */

import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

const directusUrl = process.env.PUBLIC_DIRECTUS_URL;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN;
const mailgunKey = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;

console.log('\n🔍 Newsletter Configuration Diagnostic\n');
console.log('=' .repeat(50));

// Check 1: Environment variables
console.log('\n1. Environment Variables:');
console.log('   PUBLIC_DIRECTUS_URL:', directusUrl ? '✅ Set' : '❌ Missing');
console.log('   DIRECTUS_ADMIN_TOKEN:', adminToken ? '✅ Set' : '❌ Missing');
console.log('   MAILGUN_API_KEY:', mailgunKey ? '✅ Set' : '❌ Missing');
console.log('   MAILGUN_DOMAIN:', mailgunDomain ? '✅ Set' : '❌ Missing');

if (!directusUrl || !adminToken) {
  console.log('\n❌ Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Check 2: Test Directus connection (unauthenticated)
console.log('\n2. Testing Directus Connection (Public):');
const directus = createDirectus(directusUrl).with(rest());

try {
  const settings = await directus.request(readItems('settings', { limit: 1 }));
  if (settings && settings.length > 0) {
    console.log(`   ✅ Settings collection found (ID: ${settings[0].id})`);
    console.log(`   Last newsletter sent: ${settings[0].last_newsletter_sent || 'Never'}`);
  } else {
    console.log('   ❌ Settings collection exists but has no records!');
    console.log('   → Create a settings record in Directus:');
    console.log('      1. Go to Content → Settings');
    console.log('      2. Click "Create Item"');
    console.log('      3. Save (you can leave fields empty)');
  }
} catch (error) {
  console.log('   ❌ Failed to fetch settings:', error.message);
  console.log('   → Make sure Public role has Read access to settings collection');
}

// Check 3: Test Directus connection (authenticated)
console.log('\n3. Testing Directus Admin Authentication:');
const directusAdmin = createDirectus(directusUrl).with(staticToken(adminToken)).with(rest());

try {
  const settings = await directusAdmin.request(readItems('settings', { limit: 1 }));
  if (settings && settings.length > 0) {
    console.log('   ✅ Admin token works! Can read settings.');

    // Try to update settings (dry run)
    try {
      await directusAdmin.request({
        method: 'PATCH',
        path: `/items/settings/${settings[0].id}`,
        body: JSON.stringify({ last_newsletter_sent: new Date().toISOString() })
      });
      console.log('   ✅ Admin token can update settings!');
    } catch (updateError) {
      console.log('   ❌ Admin token cannot update settings:', updateError.message);
      console.log('   → Check that your admin user has full permissions');
    }
  } else {
    console.log('   ❌ No settings records found (even with admin token)');
    console.log('   → Create a settings record in Directus first');
  }
} catch (error) {
  console.log('   ❌ Admin authentication failed:', error.message);
  console.log('   → Check that DIRECTUS_ADMIN_TOKEN is correct');
  console.log('   → Generate token: User Directory → Your User → Token field → + button');
}

// Check 4: Test Mailgun
console.log('\n4. Testing Mailgun Configuration:');
if (!mailgunKey || !mailgunDomain) {
  console.log('   ⚠️  Mailgun not configured (optional for testing)');
} else {
  console.log(`   Domain: ${mailgunDomain}`);
  console.log(`   API Key: ${mailgunKey.substring(0, 8)}...`);

  // Test Mailgun API
  try {
    const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: 'GET', // Just check if domain exists
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${mailgunKey}`).toString('base64')}`
      }
    });

    if (response.status === 401) {
      console.log('   ❌ Mailgun authentication failed (401 Unauthorized)');
      console.log('   → Check that MAILGUN_API_KEY is correct (should start with "key-")');
      console.log('   → Get your API key from: https://app.mailgun.com/settings/api_security');
    } else if (response.status === 404) {
      console.log('   ❌ Domain not found (404)');
      console.log('   → Verify MAILGUN_DOMAIN is correct');
      console.log('   → Check domain status: https://app.mailgun.com/sending/domains');
    } else if (response.ok) {
      console.log('   ✅ Mailgun authentication successful!');
    } else {
      console.log(`   ⚠️  Unexpected response: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('   ❌ Mailgun API error:', error.message);
  }
}

console.log('\n' + '='.repeat(50));
console.log('\n✨ Diagnostic complete!\n');
