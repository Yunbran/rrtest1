// Include Our Plugins
//includes the gulp core plugins associated with the tasks
//that we will be performing.  Next we setup each of our separate
//tasks.  These tasks are lint, sass, scripts, and default.
var gulp = require('gulp');
var g = require('gulp-load-plugins')({lazy:false});

//run gulp in command line to perform all of these actions
gulp.task('default', [/*'clean'*/], function(done) {
 g.runSequence(['inject'], done);
});

// clean build directory
// gulp.task('clean', function(){
//   gulp.src('./dist', {read: false} )
//     .pipe( g.clean());
// });

//CLEAN GULP TASK
// gulp.task('clean', del.bind(null, ['./dist']));



//without this our dependencies will not be auto injected into index.html
// auto-inject JS scripts into <script> in index.html
gulp.task('inject', function(){
  var target = gulp.src('./public/index.html');
  var scripts = gulp.src(['./public/js/app.js', './public/js/**/*.js'], {read:false});
  return target
    .pipe(g.inject(scripts, {
      name:'AngularFiles',
      ignorePath:'public',
      addRootSlash:false
    }))
    .pipe(gulp.dest('./public'));
});

//without this our js files will not be checked for syntax errors
// gulp.task('jshint', function() {
//     return gulp.src(['./public/scripts/**/*.js', './specs/*/**.js', './app/**/*.js'])
//         .pipe(g.jshint())
//         .pipe(g.jshint.reporter('default'));
// });




//without this our files will not be watched for changes and
//our browser will not reload automatically when changes are made
//our tests will also re-run automaitcally when changes are made
//to the spec files
// gulp.task('browser-sync', ['styles'], function() {
//     browserSync({
//         notify: false,
//         server: './public'
//     });
//     gulp.watch(['./public/index.html'], reload);
//     gulp.watch(['./public/**/*.html'], reload);
//     gulp.watch(['./public/css/**/*.{scss,css}',], ['styles', reload]);
//     gulp.watch(['./public/scripts/**/*.js', './app/**/*.js'], ['jshint']);
//     gulp.watch(['./specs/*/**.js'], ['mocha']);
//     gulp.watch(['./public/images/**/*'], reload);
// });
