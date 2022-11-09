const gulp = require('gulp');
const browserSync = require('browser-sync');
const path = require("path");
const fs = require("fs");
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if');
const image = require('gulp-image');
const changed = require('gulp-changed');
const imageResize = require('gulp-image-resize');
const pug = require('gulp-pug');
const stylus = require('gulp-stylus');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const replace = require('gulp-replace');
const minifyHtml = require('gulp-minify-html');
const cssmin = require('gulp-cssmin');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const data = require('gulp-data');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const bootstrap = require('bootstrap-styl');
const pkg = require('./package.json');
const isProduction = ((process.env.NODE_ENV || '').trim().toLowerCase() == 'production');
const bsConfig = require('./bs-config.js');
const useCDN = false
const modeKurenai = false
const withoutPartial = '!./src/**/_*';
const srcDir = './src';
const src = {
  any: `${srcDir}/**/*`,
  html: `${srcDir}/html/**/*.{html}`,
  pug: `${srcDir}/html/**/*.{pug}`,
  css: `${srcDir}/css/**/*.{css,styl}`,
  js: `${srcDir}/js/**/*.{js,ts}`,
  img: `${srcDir}/img/**/*.{png,jpg,svg,gif}`,
  assets: {
    css: `${srcDir}/assets/css/*`,
    js: `${srcDir}/assets/js/*`,
    img: `${srcDir}/assets/img/*`
  }
};
const buildDir = './build';
const build = {
  any: `${buildDir}/**/*`,
  html: `${buildDir}`,
  pug: `${buildDir}`,
  css: `${buildDir}/css`,
  js: `${buildDir}/js`,
  img: `${buildDir}/img`,
  font: `${buildDir}/fonts`,
};
const distDir = './dist';
const fontTask = gulp.series(copy_font_files, font);
const buildTasks = gulp.series(html, buildPug, css, js, img, fontTask);
const assets = gulp.series(assets_css, assets_js, assets_img);
if (useCDN) {
  var beforeBuild = gulp.series(assets);
  var webpackConfig = require('./webpack.config.cdn.js');
} else {
  var beforeBuild = gulp.series(fontTask, assets);
  var webpackConfig = require('./webpack.config.bs.js');
}
webpackConfig.mode = isProduction ? "production" : "development";

// HTML
// ------------------------------------------------------------
function html() {
  return gulp.src([src.html, withoutPartial])
    .pipe(gulpIf(!isProduction, plumber({ errorHandler: notify.onError('html: <%= error.message %>') })))
    .pipe(data(function (file) { return { settings: require('./src/data/settings.json') } }))
    .pipe(gulpIf(isProduction, minifyHtml()))
    .pipe(gulp.dest(build.html));
}
function buildPug() {
  return gulp.src([src.pug, withoutPartial])
    .pipe(gulpIf(!isProduction, plumber({ errorHandler: notify.onError('html: <%= error.message %>') })))
    .pipe(data(function (file) { return { settings: require('./src/data/settings.json') } }))
    .pipe(pug({
      locals: {
        useCDN: useCDN,
        pretty: true,
      }
    })
    )
    .pipe(gulpIf(isProduction, minifyHtml()))
    .pipe(gulp.dest(build.pug));
}
// CSS
// ------------------------------------------------------------
function css() {
  return gulp.src([src.css, withoutPartial])
    .pipe(gulpIf(!isProduction, plumber({ errorHandler: notify.onError('css: <%= error.message %>') })))
    .pipe(gulpIf(!isProduction, sourcemaps.init({ loadMaps: true })))
    .pipe(gulpIf(/\.styl/, stylus({
      use: bootstrap(),
      'include css': true,
      define: {
        '$useCDN': useCDN,
        '$mode-kurenai': modeKurenai
      }
    })))
    .pipe(gulpIf(!isProduction, sourcemaps.write('.', {
      addComment: true,
      sourceRoot: './src'
    })))
    .pipe(gulp.dest(build.css));
}
// JavaScript
// ------------------------------------------------------------
function js() {
  return gulp.src(src.js)
    .pipe(gulpIf(!isProduction, plumber({ errorHandler: notify.onError('js: <%= error.message %>') })))
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(build.js));
}
// Image
// ------------------------------------------------------------
function img() {
  return gulp.src(src.img)
    .pipe(gulpIf(!isProduction, plumber({ errorHandler: notify.onError('img: <%= error.message %>') })))
    .pipe(changed(build.img))
    .pipe(imageResize({ width: 1280, height: 1280, imageMagick: true }))
    .pipe(image())
    .pipe(gulp.dest(build.img));
}
// Fonts
// ------------------------------------------------------------
function copy_font_files() {
  return gulp.src(['./node_modules/yakuhanjp/dist/fonts/YakuHanJP/*', './node_modules/bootstrap-styl/fonts/*'])
    .pipe(gulpIf(!isProduction, plumber({ errorHandler: notify.onError('copy_font-files: <%= error.message %>') })))
    .pipe(gulp.dest(build.font));
}
function font() {
  return gulp.src(['./node_modules/yakuhanjp/dist/css/yakuhanjp.min.css'])
    .pipe(gulpIf(!isProduction, plumber({ errorHandler: notify.onError('font: <%= error.message %>') })))
    .pipe(replace('../fonts/YakuHanJP/', '../fonts/'))
    .pipe(gulp.dest(`${build.css}/plugins`));
}
// Copy Assets
// ------------------------------------------------------------
function assets_css() {
  return gulp.src([src.assets.css])
    .pipe(gulpIf(!isProduction, plumber({ errorHandler: notify.onError('assets: <%= error.message %>') })))
    .pipe(gulp.dest(`${build.css}/plugins`));
}
function assets_js() {
  return gulp.src([src.assets.js])
    .pipe(gulpIf(!isProduction, plumber({ errorHandler: notify.onError('assets: <%= error.message %>') })))
    .pipe(gulp.dest(build.js));
}
function assets_img() {
  return gulp.src([src.assets.img])
    .pipe(gulpIf(!isProduction, plumber({ errorHandler: notify.onError('assets: <%= error.message %>') })))
    .pipe(gulp.dest(build.img));
}
// Server, Reload, Watch
// ------------------------------------------------------------
function server() {
  return browserSync(bsConfig);
}

function reload() {
  return browserSync.reload();
}

function watchTask(cb) {
  gulp.watch(src.html, gulp.series(html, reload));
  gulp.watch(src.pug, gulp.series(buildPug, reload));
  gulp.watch(src.css, gulp.series(css, reload));
  gulp.watch(src.js, gulp.series(js, reload));
  gulp.watch(src.img, gulp.series(img, reload));
}
// Build and Deploy
// ------------------------------------------------------------
function clean() {
  return del([`${buildDir}/*`, `${distDir}/*`]);
}
const buildTask = gulp.series(beforeBuild, buildTasks);
function make() {
  return gulp.src(
    [
      './build/css/*.css',
      './build/fonts/*',
      './build/img/*',
      './build/js/*.js',
      '!./build/**/*.map'
    ],
    {
      base: buildDir
    }
  )
    .pipe(gulp.dest(distDir))
}
function compress() {
  return gulp.src(`${build.css}/bootstrap.css`)
    .pipe(cssmin())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest(`${distDir}/css`));
}
function msg(cb) {
  console.log("👍  Deployed, YEY!");
  cb();
}

exports.build = buildTask;
exports.deploy = gulp.series(clean, buildTask, make, compress, msg);
exports.default = gulp.series(buildTask, gulp.parallel(watchTask, server));
