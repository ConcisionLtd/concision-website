import { readFileSync } from 'node:fs';
import path from 'node:path';

const INCLUDE_PATTERN = /<!--\s*@include\s+(\S+)\s*-->/g;
const PLACEHOLDER_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;
const PARTIALS_DIRECTORY = 'partials';
const FULL_RELOAD_EVENT = { type: 'full-reload', path: '*' };

const readPartial = (absolutePath, includePath) => {
  try {
    return readFileSync(absolutePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Missing partial: ${includePath} (expected at ${absolutePath})`, {
        cause: error,
      });
    }
    throw error;
  }
};

const expandIncludes = (html, root, stack) =>
  html.replace(INCLUDE_PATTERN, (_, includePath) => {
    const absolutePath = path.resolve(root, includePath);
    const isCircular = stack.includes(absolutePath);
    if (isCircular) {
      throw new Error(`Circular include: ${[...stack, absolutePath].join(' -> ')}`);
    }
    const contents = readPartial(absolutePath, includePath);
    return expandIncludes(contents, root, [...stack, absolutePath]);
  });

const resolveValue = (data, dottedPath) =>
  dottedPath.split('.').reduce((value, key) => (value == null ? undefined : value[key]), data);

const substitutePlaceholders = (html, data) =>
  html.replace(PLACEHOLDER_PATTERN, (_, dottedPath) => {
    const value = resolveValue(data, dottedPath);
    const isPrintable = value != null && typeof value !== 'object';
    if (!isPrintable) {
      throw new Error(`Unknown placeholder: {{ ${dottedPath} }}`);
    }
    return String(value);
  });

// values are inserted verbatim: every value comes from site.config.js and is author-controlled
export const renderHtml = (html, { root, data }) =>
  substitutePlaceholders(expandIncludes(html, root, []), data);

export const htmlPartials = ({ data }) => {
  let root;

  return {
    name: 'html-partials',
    configResolved(config) {
      root = config.root;
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => renderHtml(html, { root, data }),
    },
    configureServer(server) {
      const partialsDirectory = path.resolve(root, PARTIALS_DIRECTORY) + path.sep;
      server.watcher.on('change', (file) => {
        const isPartial = file.startsWith(partialsDirectory);
        if (isPartial) {
          server.hot.send(FULL_RELOAD_EVENT);
        }
      });
    },
  };
};
