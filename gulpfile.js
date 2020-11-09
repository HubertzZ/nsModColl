let gulp = require('gulp'),
    ts = require('gulp-typescript'),
    tsProject = ts.createProject('tsconfig.json'),
    uglify = require('gulp-uglify'),
    copyFiles = [
        'src/**/*.ftl',
        'src/**/*.html',
        'src/**/*.js'
    ];

gulp.task('copy', function () {
    return gulp.src(copyFiles)
        .pipe(gulp.dest('dist'));
});

gulp.task('default', function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest('dist'));
});

gulp.task('compress', function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(uglify({output:{comments:/@NApiVersion|@NSuiteType/i}}))
        .pipe(gulp.dest('dist'));
});