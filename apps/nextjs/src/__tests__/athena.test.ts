 import { decideRoute } from '../lib/athena';

 describe('decideRoute', () => {
   it('routes to local for short prompts', async () => {
     const route = await decideRoute('hello world');
     expect(route).toBe('local');
   });

   it('routes to cloud for long prompts', async () => {
     const longText = 'x'.repeat(5000);
     const route = await decideRoute(longText);
     expect(route).toBe('cloud');
   });
 });