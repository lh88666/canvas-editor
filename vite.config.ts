import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import * as path from 'path'

export default defineConfig(({ mode }) => {
  const name = 'canvas-editor'
  if (mode === 'lib') {
    return {
      plugins: [
        cssInjectedByJsPlugin({
          styleId: `${name}-style`,
          topExecutionPriority: true
        }),
        {
          ...typescript({
            tsconfig: './tsconfig.json',
            include: ['./src/editor/**']
          }),
          apply: 'build',
          declaration: true,
          declarationDir: 'types/',
          rootDir: '/'
        }
      ],
      build: {
        lib: {
          name,
          fileName: name,
          entry: path.resolve(__dirname, 'src/editor/index.ts')
        },
        rollupOptions: {
          output: {
            sourcemap: true
          }
        }
      }
    }
  }
  return {
    base: '/',
    server: {
      host: '0.0.0.0'
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          blank: path.resolve(__dirname, 'blank.html'),
          docx: path.resolve(__dirname, 'docx.html'),
          excel: path.resolve(__dirname, 'excel.html'),
          example: path.resolve(__dirname, 'example.html')
        }
      }
    }
  }
})
