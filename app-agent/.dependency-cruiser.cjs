/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'entities-is-pure',
      severity: 'error',
      comment: 'Domain layer must not depend on other packages',
      from: { path: '^packages/entities' },
      to: { path: '^packages/(?!entities)' },
    },
    {
      name: 'no-ui-in-core',
      severity: 'error',
      comment: 'Core must not depend on UI',
      from: { path: '^packages/core' },
      to: { path: '^packages/ui' },
    },
    {
      name: 'no-core-in-infra',
      severity: 'error',
      comment: 'Infrastructure packages must not depend on core',
      from: {
        path: '^packages/(state-manager|memory|llm|tools|planner|workflow|semantic-registry)',
      },
      to: { path: '^packages/core' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'No circular dependencies',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.base.json',
    },
  },
};
