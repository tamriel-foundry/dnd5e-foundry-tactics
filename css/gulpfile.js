const gulp = require('gulp');
const less = require('gulp-less');
const path = require('path');

// Compile LESS CSS
gulp.task('less', function () {
  return gulp.src('ftc.less')
    .pipe(less({paths: ['./']}))
    .pipe(gulp.dest('./'));
});

// Compile scripts, and watch for changes
gulp.task('default', ['less']);

