import { defineConfig } from 'orval';

export default defineConfig({
  calendar: {
    input: {
      target: '../spec/tsp-output/@typespec/openapi3/openapi.yaml',
    },
    output: {
      mode: 'tags-split',
      target: './src/lib/api',
      schemas: './src/lib/api/model',
      client: 'svelte-query',
      override: {
        mutator: undefined,
        query: {
          useQuery: true,
        },
      },
    },
  },
});
