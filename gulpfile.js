'use strict';

const gulp      = require('gulp');
const babel     = require('gulp-babel');
const apidoc    = require('./index.js');
const apiConfig = require('./package.json').apiConfig;

gulp.task('babel', function () {
  gulp.src('lib/apidoc.js')
      .pipe(babel())
      .pipe(gulp.dest('outlib/'));
});

gulp.task('yapi', function () {
  return apidoc(['test/**/*.js'], apiConfig);
});