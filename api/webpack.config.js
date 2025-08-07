const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  // NxAppWebpackPlugin now handles all of this automatically
  // No need for a separate output object
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: true, // Use optimization for production builds
      outputHashing: 'none',
      generatePackageJson: true,
      outputPath: join(__dirname, '../dist/api'), // Specify output path here
    }),
  ],
  watchOptions: {
    ignored: '**/node_modules',
  },
};
