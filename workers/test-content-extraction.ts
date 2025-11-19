/**
 * Test script for content extraction service
 * Run with: npx tsx test-content-extraction.ts
 */

import { extractArticleContent } from './src/services/content-extraction';

const testUrls = [
  'https://www.theverge.com/2024/1/15/24038711/spacex-starship-third-test-flight-faa-approval',
  'https://news.ycombinator.com/item?id=38981254',
  'https://techcrunch.com/2024/01/18/anthropic-claude-ai-assistant/',
  'https://www.bbc.com/news/technology',
  'https://github.com/anthropics/claude-code'
];

async function testExtraction() {
  console.log('🧪 Testing Content Extraction Service\n');
  console.log('=' .repeat(80));

  for (const url of testUrls) {
    console.log(`\n📄 Testing: ${url}`);
    console.log('-'.repeat(80));

    try {
      const startTime = Date.now();
      const result = await extractArticleContent(url, {
        useJinaAI: true,
        timeout: 15000
      });
      const duration = Date.now() - startTime;

      console.log(`✅ Success (${duration}ms)`);
      console.log(`   Method: ${result.extractionMethod}`);
      console.log(`   Title: ${result.title}`);
      console.log(`   Author: ${result.author || 'N/A'}`);
      console.log(`   Excerpt: ${result.excerpt?.substring(0, 100)}...`);
      console.log(`   Word Count: ${result.wordCount}`);
      console.log(`   Reading Time: ${result.readingTimeMinutes} min`);
      console.log(`   Content Length: ${result.content.length} chars`);

      if (result.extractionError) {
        console.log(`   ⚠️  Error: ${result.extractionError}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✨ Testing complete!');
}

// Run the tests
testExtraction().catch(console.error);
