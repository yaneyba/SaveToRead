
import { loadEnv } from 'vite';

const mode = 'production';
const env = loadEnv(mode, process.cwd(), '');

console.log('Mode:', mode);
console.log('VITE_API_URL:', env.VITE_API_URL);
