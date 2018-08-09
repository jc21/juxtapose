/*jshint node:true */

'use strict';

const path          = require('path');
const gulp          = require('gulp');
const gutil         = require('gulp-util');
const concat        = require('gulp-concat-util');
const runSequence   = require('run-sequence');
const webpack       = require('webpack');
const webpackStream = require('webpack-stream');
const imagemin      = require('gulp-imagemin');
const del           = require('del');
const bump          = require('gulp-bump');
const sass          = require('gulp-sass');
const ejs           = require('gulp-ejs');
const PACKAGE       = require('./package.json');

const assets = {
    views:  {
        watch: 'views/**/*.ejs',
        src:   'views/*.ejs',
        dest:  'dist/'
    },
    fonts:  {
        watch: 'src/frontend/fonts/**/*.{ttf,woff,woff2,eof,eot,svg,otf}',
        dest:  'dist/fonts'
    },
    images: {
        watch: 'src/frontend/images/**/*.{png,jpg,gif}',
        dest:  'dist/images'
    },
    scss:   {
        watch:    'src/frontend/scss/**/*.scss',
        loadPath: 'src/frontend/scss',
        src:      'src/frontend/scss/styles.scss',
        dest:     'dist/css'
    },
    js:     {
        watch: 'src/frontend/js/**/*',
        src:   'src/frontend/js/main.js',
        dest:  'dist/js/'
    },
    other:  {
        watch: 'src/frontend/other/**/*',
        dest:  'dist/other'
    }
};

/**
 * @param color
 * @param label
 * @returns {Function}
 */
function logger (color, label) {
    return function () {
        let args = Array.prototype.slice.call(arguments);
        args.unshift(gutil.colors[color].bold(label.toUpperCase() + ':'));
        gutil.log.apply(null, args);
    };
}

gutil.error  = logger('red', 'error');
gutil.warn   = logger('yellow', 'warn');
gutil.notice = logger('white', 'notice');

/**
 * @param err
 */
function handleError (err) {
    gutil.error(err.stack);
}

/*****************************
 TASKS
 ******************************/

/**
 * clean
 */
gulp.task('clean', function (cb) {
    del(['./dist/*'])
        .then(function () {
            cb();
        })
        .catch(handleError);
});

/**
 * images
 */
gulp.task('images', function () {
    if (process.arch !== 'arm') {
        return gulp.src(assets.images.watch)
            .pipe(imagemin({
                optimizationLevel: 7
            }))
            .pipe(gulp.dest(assets.images.dest))
            .on('error', handleError);
    } else {
        return gulp.src(assets.images.watch)
            .pipe(gulp.dest(assets.images.dest))
            .on('error', handleError);
    }
});

/**
 * fonts
 */
gulp.task('fonts', function () {
    return gulp.src(assets.fonts.watch)
        .pipe(gulp.dest(assets.fonts.dest))
        .on('error', handleError);
});

/**
 * other
 */
gulp.task('other', function () {
    return gulp.src(assets.other.watch)
        .pipe(gulp.dest(assets.other.dest))
        .on('error', handleError);
});

/**
 * scss
 */
gulp.task('scss', function () {
    return gulp.src(assets.scss.src)
        .pipe(sass().on('error', sass.logError))
        .pipe(concat.header('@import url(\'https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300,700\');@import url(\'https://fonts.googleapis.com/css?family=Roboto:100,200,300,400,500,600,700|Roboto+Condensed:300,400,700\');'))
        .pipe(gulp.dest(path.resolve(assets.scss.dest)));
});

/**
 * js
 */
gulp.task('js', function () {
    return gulp.src(assets.js.src)
        .pipe(webpackStream(require('./webpack.config.js'), webpack))
        .pipe(gulp.dest(assets.js.dest))
        .on('error', handleError);
});

/**
 * views
 */
gulp.task('views', function () {
    return gulp.src(assets.views.src)
        .pipe(ejs({
            version: PACKAGE.version
        }, {}, {
            ext: '.html'
        }))
        .on('error', handleError)
        .pipe(gulp.dest(assets.views.dest));
});

/**
 * bump
 */
gulp.task('bump', function () {
    gulp.src('./package.json')
        .pipe(bump({type: 'version'}))
        .pipe(gulp.dest('./'));
});

/**
 * build
 */
gulp.task('build', function (cb) {
    runSequence('clean', ['images', 'fonts', 'other', 'scss', 'js', 'views'], cb);
});

/**
 * default
 */
gulp.task('default', ['build'], function () {
    gulp.watch(assets.scss.watch, ['scss']);
    gulp.watch(assets.images.watch, ['images']);
    gulp.watch(assets.fonts.watch, ['fonts']);
    gulp.watch(assets.other.watch, ['other']);
    gulp.watch(assets.js.watch, ['js']);
    gulp.watch(assets.views.watch, ['views']);
    gulp.watch('./webpack.config.js', ['js']);
});
