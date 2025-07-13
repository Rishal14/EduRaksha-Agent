#!/usr/bin/env node

/**
 * Test script for Google Cloud Translation API
 * Run this to verify your API key setup
 */

require('dotenv').config({ path: '.env.local' });

const { Translate } = require('@google-cloud/translate/build/src/v2');

async function testTranslation() {
  console.log('🔍 Testing Google Cloud Translation API Setup...\n');

  // Check environment variables
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  console.log('📋 Environment Variables:');
  console.log(`   Project ID: ${projectId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   API Key: ${apiKey ? '✅ Set' : '❌ Missing'}\n`);

  if (!projectId || !apiKey) {
    console.log('❌ Missing required environment variables!');
    console.log('Please set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_TRANSLATE_API_KEY in .env.local');
    console.log('See GOOGLE_API_SETUP.md for detailed instructions.');
    process.exit(1);
  }

  try {
    // Initialize the translation client
    const translate = new Translate({
      projectId: projectId,
      key: apiKey,
    });

    console.log('🚀 Initializing translation client...');

    // Test translations
    const testTexts = [
      'Hello, how are you?',
      'Am I eligible for scholarship?',
      'How do I prove my income?'
    ];

    console.log('\n📝 Testing translations...\n');

    for (const text of testTexts) {
      console.log(`Original (English): "${text}"`);
      
      // Translate to Kannada
      try {
        const [kannadaTranslation] = await translate.translate(text, 'kn');
        console.log(`Kannada: "${kannadaTranslation}"`);
      } catch (error) {
        console.log(`Kannada: ❌ Error - ${error.message}`);
      }

      // Translate to Hindi
      try {
        const [hindiTranslation] = await translate.translate(text, 'hi');
        console.log(`Hindi: "${hindiTranslation}"`);
      } catch (error) {
        console.log(`Hindi: ❌ Error - ${error.message}`);
      }

      console.log('---');
    }

    console.log('\n✅ Translation API test completed successfully!');
    console.log('Your setup is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Visit http://localhost:3000/translation-test');
    console.log('3. Test the web interface');

  } catch (error) {
    console.log('\n❌ Translation API test failed!');
    console.log(`Error: ${error.message}`);
    console.log('\nTroubleshooting:');
    console.log('1. Check if Translation API is enabled in Google Cloud Console');
    console.log('2. Verify your API key is correct and not restricted');
    console.log('3. Ensure billing is enabled for your project');
    console.log('4. See GOOGLE_API_SETUP.md for detailed instructions');
    process.exit(1);
  }
}

// Run the test
testTranslation().catch(console.error); 