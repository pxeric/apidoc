#!/usr/bin/env node
(function () {
  'use strict';
  const path     = require('path');
  const minimist = require('minimist');
  const apiDoc   = require('../index');

  let apiConfig = require(path.join(process.cwd(), 'package.json')).apiConfig || {};

  const argv = minimist(process.argv.slice(2));

  if (argv.h || argv.help || argv._.length === 0) {
    return usage();
  }

  if (argv.project_id) apiConfig.project_id = argv.project_id;
  if (argv.token) apiConfig.token = argv.token;

  if (!apiConfig.project_id || !apiConfig.token) {
    console.log('must set project_id & token');
    return usage();
  }

  apiDoc(argv._, apiConfig);

  function usage() {
    console.log(`
    Usage: apidoc [options] file file1 ...
      file      api file, split with comma; example: controller/**/*.js  app/controller/**/*.js
    Options:
      --project_id    project ID, default use apiConfig.project_id in package.json
      --token         access token, default use apiConfig.token in package.json
      -h, --help      Output usage infomation
    `);
  }
})();