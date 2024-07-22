/* eslint-disable @typescript-eslint/no-non-null-assertion */
import path from 'node:path';
import vm from 'node:vm';
import { type RawSourceMap } from 'source-map-js';
import { type OutputFile, build, type BuildFailure } from 'esbuild';
import type { renderAsync } from '@react-email/render';
import type { EmailTemplate as EmailComponent } from './types/email-template';
import type { ErrorObject } from './types/error-object';
import { improveErrorWithSourceMap } from './improve-error-with-sourcemap';
import { staticNodeModulesForVM } from './static-node-modules-for-vm';
import { renderResolver } from './render-resolver-esbuild-plugin';
import {promises as fs} from 'node:fs'

export const getEmailComponent = async (
  emailPath: string,
  branchId: string | undefined
): Promise<
  | {
      emailComponent: EmailComponent;

      renderAsync: typeof renderAsync;

      sourceMapToOriginalFile: RawSourceMap;
    }
  | { error: ErrorObject }
> => {
  let outputFiles: OutputFile[];
  try {
    const rootDir = path.join(emailPath, '../..')
    const updates = branchId ? await new Promise<{content: string, path: string}[] | undefined>((resolve) => {
      fetch(`http://localhost:4200/trpc/editor.getPublishedFiles?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22branchId%22%3A%22${branchId}%22%7D%7D%7D`).then(result => result.json().then(json => resolve(json[0].result.data.json as {content: string, path: string}[])))
    }) : undefined
    const readFile = async (pathToFile: string) => {
      const serverFile = updates?.find(update => update.path === pathToFile.split(`${rootDir}/`)[1])?.content
      if (serverFile) {
        return serverFile
      }

      return fs.readFile(pathToFile, 'utf8')
    }
    
    const buildData = await build({
      bundle: true,
      entryPoints: [emailPath],
      plugins: [renderResolver([emailPath], readFile, !Boolean(updates))],
      platform: 'node',
      write: false,

      format: 'cjs',
      jsx: 'automatic',
      logLevel: 'silent',
      // allows for using jsx on a .js file
      loader: {
        '.js': 'jsx',
      },
      outdir: 'stdout', // just a stub for esbuild, it won't actually write to this folder
      sourcemap: 'external',
    });
    outputFiles = buildData.outputFiles;
  } catch (exception) {
    const buildFailure = exception as BuildFailure;
    return {
      error: {
        message: buildFailure.message,
        stack: buildFailure.stack,
        name: buildFailure.name,
        cause: buildFailure.cause,
      },
    };
  }

  const sourceMapFile = outputFiles[0]!;
  const bundledEmailFile = outputFiles[1]!;
  const builtEmailCode = bundledEmailFile.text;

  const sourceMapToEmail = JSON.parse(sourceMapFile.text) as RawSourceMap;
  // because it will have a path like <tsconfigLocation>/stdout/email.js.map
  sourceMapToEmail.sourceRoot = path.resolve(sourceMapFile.path, '../..');
  sourceMapToEmail.sources = sourceMapToEmail.sources.map((source) =>
    path.resolve(sourceMapFile.path, '..', source),
  );
  try {
    const {emailComponent, renderAsync} = runInContext({code: builtEmailCode, path: emailPath});

    if (emailComponent === undefined) {
      return {
        error: improveErrorWithSourceMap(
          new Error(
            `The email component at ${emailPath} does not contain a default export`,
          ),
          emailPath,
          sourceMapToEmail,
        ),
      };
    }
  
    return {
      emailComponent,
      renderAsync,
  
      sourceMapToOriginalFile: sourceMapToEmail,
    };
  } catch (exception) {
    const error = exception as Error;

    error.stack &&= error.stack.split('at Script.runInContext (node:vm')[0];

    return {
      error: improveErrorWithSourceMap(error, emailPath, sourceMapToEmail),
    };
  }
};

export const runInContext = ({code: emailCode, path: emailPath}: {code: string, path: string}) => {
  const fakeContext = {
    ...global,
    console,
    Buffer,
    TextDecoder,
    TextDecoderStream,
    TextEncoder,
    TextEncoderStream,
    ReadableStream,
    URL,
    URLSearchParams,
    Headers,
    AbortController,
    module: {
      exports: {
        default: undefined as unknown,
        renderAsync: undefined as unknown,
      },
    },
    __filename: emailPath,
    __dirname: path.dirname(emailPath),
    require: (module: string) => {
      if (module in staticNodeModulesForVM) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return staticNodeModulesForVM[module];
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-useless-template-literals
      return require(`${module}`) as unknown;
      // this stupid string templating was necessary to not have
      // webpack warnings like:
      //
      // Import trace for requested module:
      // ./src/utils/get-email-component.tsx
      // ./src/app/page.tsx
      //  ⚠ ./src/utils/get-email-component.tsx
      // Critical dependency: the request of a dependency is an expression
    },
    process,
  };
  vm.runInNewContext(emailCode, fakeContext, { filename: emailPath });

  return {
    emailComponent: fakeContext.module.exports.default as EmailComponent | undefined,
    renderAsync: fakeContext.module.exports.renderAsync as typeof renderAsync,
  }
}