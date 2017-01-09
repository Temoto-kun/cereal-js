var src = [
        './src/export.js'
    ],

    gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

gulp.task('compile-unminified', function (cb) {
    gulp.src(src)
        .pipe(concat('oatmeal.js'))
        .pipe(gulp.dest('./bin'))
        .on('end', cb);
});

gulp.task('compile-minified', function (cb) {
    gulp.src(src)
        .pipe(concat('oatmeal.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./bin'))
        .on('end', cb);
});

gulp.task('default', ['compile-unminified', 'compile-minified']);

gulp.task('watch', ['default'], function () {
    gulp.watch(src, ['default']);
});

gulp.task('test', function () {
    // TODO write tests.
});
