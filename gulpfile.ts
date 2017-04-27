import gulp          = require('gulp');
import browserSync   = require('browser-sync');
import * as path from "path";
import * as fs from "fs";
import del           = require('del');
import watch         = require('gulp-watch');
import sourcemaps    = require('gulp-sourcemaps');
import gulpIf        = require('gulp-if');
import image         = require('gulp-image');
import changed       = require('gulp-changed');
import imageResize   = require('gulp-image-resize');
import pug           = require('gulp-pug');
import stylus        = require('gulp-stylus');
import webpack       = require('webpack');
import webpackStream = require('webpack-stream');
import replace       = require('gulp-replace');
import minifyHtml    = require('gulp-minify-html');
import cssmin        = require('gulp-cssmin');
import uglify        = require('gulp-uglify');
import data          = require('gulp-data');
import plumber       = require('gulp-plumber');
import runSequence   = require('run-sequence');
import notify        = require('gulp-notify');
import bootstrap     = require('bootstrap-styl');
const pkg            = require('./package.json');
const isProduction   = ((process.env.NODE_ENV || '').trim().toLowerCase() == 'production');
const bsConfig       = require('./bs-config.js');
const useCDN         = false
const modeKurenai    = false
const withoutPartial = '!./src/**/_*';
const srcDir      = './src';
const src = {
  any:   `${srcDir}/**/*`,
  html:  `${srcDir}/html/**/*.{html,pug}`,
  css:   `${srcDir}/css/**/*.{css,styl}`,
  js:    `${srcDir}/js/**/*.{js,ts}`,
  img:   `${srcDir}/img/**/*.{png,jpg,svg,gif}`,
  assets: {
    css: `${srcDir}/assets/css/*`,
    js:  `${srcDir}/assets/js/*`,
    img: `${srcDir}/assets/img/*`
  }
};
const buildDir    = './build';
const build = {
  any:  `${buildDir}/**/*`,
  html: `${buildDir}`,
  css:  `${buildDir}/css`,
  js:   `${buildDir}/js`,
  img:  `${buildDir}/img`,
  font: `${buildDir}/fonts`,
};
const distDir     = './dist';
const buildTasks  = ['html', 'css', 'js', 'img']
if (useCDN) {
  var beforeBuild   = ['assets'];
  var webpackConfig  = require('./webpack.config.cdn.js');
} else {
  var beforeBuild    = ['font', 'assets'];
  var webpackConfig  = require('./webpack.config.bs.js');
}

// HTML
// ------------------------------------------------------------
gulp.task('html', () => {
  return gulp.src([src.html, withoutPartial])
    .pipe(gulpIf(!isProduction, plumber({errorHandler: notify.onError('html: <%= error.message %>')})))
    .pipe(data(function(file) { return {settings: require('./src/data/settings.json')}}))
    .pipe(gulpIf(/\.pug/, pug({
      basedir: './src/html/',
      pretty: true,
      locals: {'useCDN': useCDN}
    })))
    .pipe(gulpIf(isProduction, minifyHtml()))
    .pipe(gulp.dest(build.html));
});
// CSS
// ------------------------------------------------------------
gulp.task('css', () => {
  return gulp.src([src.css, withoutPartial])
    .pipe(gulpIf(!isProduction, plumber({errorHandler: notify.onError('css: <%= error.message %>')})))
    .pipe(gulpIf(!isProduction, sourcemaps.init({loadMaps: true})))
    .pipe(gulpIf(/\.styl/, stylus({
      use: bootstrap(),
      'include css': true,
      define: {'$useCDN': useCDN,
               '$mode-kurenai': modeKurenai
             }
    })))
    .pipe(gulpIf(isProduction, cssmin()))
    .pipe(gulpIf(!isProduction, sourcemaps.write('.', {
      addComment: true,
      sourceRoot: './src'
    })))
    .pipe(gulp.dest(build.css));
});
// JavaScript
// ------------------------------------------------------------
gulp.task('js', () => {
  return gulp.src(src.js)
    .pipe(gulpIf(!isProduction, plumber({errorHandler: notify.onError('js: <%= error.message %>')})))
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(gulp.dest(build.js));
});
// Image
// ------------------------------------------------------------
gulp.task('img', () => {
  return gulp.src(src.img)
    .pipe(gulpIf(!isProduction, plumber({errorHandler: notify.onError('img: <%= error.message %>')})))
    .pipe(changed(build.img))
    .pipe(imageResize({width: 1280, height: 1280, imageMagick: true}))
    .pipe(image())
    .pipe(gulp.dest(build.img));
});
// Fonts
// ------------------------------------------------------------
gulp.task('copy_font-files', () => {
  return gulp.src(['./node_modules/yakuhanjp/dist/fonts/YakuHanJP/*', './node_modules/bootstrap-styl/fonts/*'])
    .pipe(gulpIf(!isProduction, plumber({errorHandler: notify.onError('copy_font-files: <%= error.message %>')})))
    .pipe(gulp.dest(build.font));
});
gulp.task('font', ['copy_font-files'], () => {
  return gulp.src(['./node_modules/yakuhanjp/dist/css/yakuhanjp.min.css'])
    .pipe(gulpIf(!isProduction, plumber({errorHandler: notify.onError('font: <%= error.message %>')})))
    .pipe(replace('../fonts/YakuHanJP/', '../fonts/'))
    .pipe(gulp.dest(`${build.css}/plugins`));
});
// Copy Assets
// ------------------------------------------------------------
gulp.task('assets_css', () => {
  return gulp.src([src.assets.css])
    .pipe(gulpIf(!isProduction, plumber({errorHandler: notify.onError('assets: <%= error.message %>')})))
    .pipe(gulp.dest(`${build.css}/plugins`));
});
gulp.task('assets_js', () => {
  return gulp.src([src.assets.js])
    .pipe(gulpIf(!isProduction, plumber({errorHandler: notify.onError('assets: <%= error.message %>')})))
    .pipe(gulp.dest(build.js));
});
gulp.task('assets_img', () => {
  return gulp.src([src.assets.img])
    .pipe(gulpIf(!isProduction, plumber({errorHandler: notify.onError('assets: <%= error.message %>')})))
    .pipe(gulp.dest(build.img));
});
gulp.task('assets', ['assets_css', 'assets_js', 'assets_img']);
// Server, Reload, Watch
// ------------------------------------------------------------
gulp.task('server', () => {
  return browserSync(bsConfig);
});

gulp.task('reload', () => {
  return browserSync.reload();
});

gulp.task('watch', () => {
  watch(src.html, () => { return runSequence('html', 'reload')});
  watch(src.css, () => { return runSequence('css', 'reload')});
  watch(src.js, () => { return runSequence('js', 'reload')});
  watch(src.img, () => { return runSequence('img', 'reload')});
});
// Build and Deploy
// ------------------------------------------------------------
gulp.task('clean', () => {
  return del([`${buildDir}/*`, `${distDir}/*`]);
})
gulp.task('build', (callback) => {
  runSequence(beforeBuild, buildTasks, callback);
});
gulp.task('make', () => {
  return gulp.src(['./build/**/*', '!./build/**/*.map', '!./build/**/plugins/'], {base: buildDir})
  .pipe(gulp.dest(distDir))
});
gulp.task('deploy', (callback) => {
  runSequence('clean', 'build', 'make', 'msg', callback);
});
gulp.task('msg', () => {
  return console.log("👍  Deployed, YEY!")
});
gulp.task('default', ['build'], () => {
 return gulp.start(['watch', 'server'])
});
