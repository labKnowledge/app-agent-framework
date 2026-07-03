import { readFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { defineConfig, type Plugin, type UserConfig } from 'vite';
import dts from 'vite-plugin-dts';

export interface ViteLibConfigOptions {
  entry?: string;
  extraPlugins?: Plugin[];
  copyAssets?: string[];
}

function findMonorepoRoot(packageDir: string): string {
  let dir = packageDir;
  while (dir !== dirname(dir)) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  return resolve(packageDir, '../..');
}

function loadPackageJson(packageDir: string): {
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
} {
  const pkg = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  return {
    dependencies: pkg.dependencies ?? {},
    peerDependencies: pkg.peerDependencies ?? {},
  };
}

function createExternal(
  dependencies: Record<string, string>,
  peerDependencies: Record<string, string>
): (id: string) => boolean {
  const deps = [...Object.keys(dependencies), ...Object.keys(peerDependencies)];

  return (id: string) => {
    if (id.startsWith('node:')) return true;
    if (id.startsWith('@app-agent/')) return true;
    return deps.some((dep) => id === dep || id.startsWith(`${dep}/`));
  };
}

function copyAssetsPlugin(packageDir: string, assets: string[]): Plugin {
  return {
    name: 'copy-assets',
    closeBundle() {
      const distDir = resolve(packageDir, 'dist');
      mkdirSync(distDir, { recursive: true });
      for (const asset of assets) {
        const source = resolve(packageDir, asset);
        const target = resolve(distDir, asset.replace(/^src\//, ''));
        if (existsSync(source)) {
          mkdirSync(dirname(target), { recursive: true });
          copyFileSync(source, target);
        }
      }
    },
  };
}

export function createViteLibConfig(
  packageDir: string,
  options: ViteLibConfigOptions = {}
): UserConfig {
  const { dependencies, peerDependencies } = loadPackageJson(packageDir);
  const entry = resolve(packageDir, options.entry ?? 'src/index.ts');
  const monorepoRoot = findMonorepoRoot(packageDir);
  const tsconfigPath = resolve(monorepoRoot, 'tsconfig.base.json');

  const plugins: Plugin[] = [
    dts({
      tsconfigPath,
      root: packageDir,
      entryRoot: 'src',
      outDir: 'dist',
      include: [`${resolve(packageDir, 'src')}/**/*.ts`, `${resolve(packageDir, 'src')}/**/*.tsx`],
      exclude: [
        `${resolve(packageDir, 'src')}/**/__tests__/**`,
        `${resolve(packageDir, 'src')}/**/*.test.ts`,
        `${resolve(packageDir, 'src')}/**/*.test.tsx`,
        `${resolve(packageDir, 'src')}/**/*.bench.ts`,
      ],
      rollupTypes: false,
      insertTypesEntry: true,
    }),
    ...(options.extraPlugins ?? []),
  ];

  if (options.copyAssets?.length) {
    plugins.push(copyAssetsPlugin(packageDir, options.copyAssets));
  }

  return defineConfig({
    root: packageDir,
    plugins,
    build: {
      lib: {
        entry,
        formats: ['es'],
        fileName: 'index',
      },
      outDir: resolve(packageDir, 'dist'),
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        external: createExternal(dependencies, peerDependencies),
      },
    },
  });
}
