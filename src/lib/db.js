require('dotenv').config();

// Register tsx to handle TypeScript imports from Prisma 7 generated client
require('tsx/cjs');

const { PrismaClient } = require('../../generated/prisma/client.ts');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Extract the raw postgres connection URL from the prisma+postgres URL
function getDirectUrl() {
  const url = process.env.DATABASE_URL || '';
  // If it's a prisma+postgres URL, decode the api_key to get the actual postgres URL
  if (url.startsWith('prisma+postgres://')) {
    try {
      const apiKey = new URL(url).searchParams.get('api_key');
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString('utf8'));
        return decoded.databaseUrl;
      }
    } catch (e) {
      console.error('Failed to decode DATABASE_URL:', e.message);
    }
  }
  return url;
}

const directUrl = getDirectUrl();
const pool = new Pool({ connectionString: directUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
