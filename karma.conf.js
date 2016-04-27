// Karma configuration
// Generated on Tue Feb 02 2016 21:45:03 GMT+0100 (CET)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['systemjs', 'jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'dist/*.spec.js',
      'dist/**/*.spec.js'
    ],

    //proxies: {
    //  '/base/app': '/base/dist/app',
    //  '/base/common': '/base/dist/common',
    //  '/jspm_packages': '/base/jspm_packages'
    //},

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    systemjs: {
      configFile: 'config.js',

      serveFiles: [
        'dist/*.js',
        'dist/**/*.js',
        'jspm_packages/**/*.js'
      ],

      // Add any additional configuration, such as mappings to modules only used in testing
      config: {
        paths: {
          'angular-mocks': 'jspm_packages/github/angular/bower-angular-mocks@1.5.0-rc.2/angular-mocks.js',
          'cc-templates': 'dist/cc-templates.js'
        }
      }
    },
    plugins: [
      'karma-systemjs',
      'karma-chrome-launcher',
      'karma-jasmine'
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  })
};
