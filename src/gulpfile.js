var gulp = require('gulp');
var compileTypescript = require('gulp-typescript');
var tslint = require('gulp-tslint');
var watch = require('gulp-watch');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var jasmine = require('gulp-jasmine');
var shell = require('gulp-shell');
var jshint = require('gulp-jshint');
var map = require('map-stream');

var gulpFile = './gulpfile.js';
var tsconfig = './.settings/tsconfig.json';
var sources = ['./src/**/**.ts'];
var specs = './specs/**/**.js';
var allSrc = [specs, tsconfig, gulpFile].concat(sources);

var tsProject = compileTypescript.createProject(tsconfig, {noExternalResolve: true});

var outputDir = 'target/js';
var outputFile = 'resilience.js';


var fs = require('fs');


gulp.task('compile-ts', function() {
  
  tsLintLogFileReset();
  
  var tsResult = gulp.src(sources)
    //tsProject.src() // instead of gulp.src(...)
    // WHEN tsconfig.json supports ignores ... 1.6 or later
    .pipe(tslint())
    //.pipe(tslint.report('prose', { emitError: false }))
    .pipe(tslint.report(tsLintCsvReporter, {emitError: false}))
    .pipe(sourcemaps.init()) // This means sourcemaps will be generated
    .pipe(compileTypescript(tsProject));

    return tsResult.js
      .pipe(concat(outputFile)) // You can use other plugins that also support gulp-sourcemaps
      .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
      .pipe(gulp.dest(outputDir));
});

gulp.task('jshint', function() {
  jsLintLogFileReset();
  return gulp.src('./specs/*.js')
    .pipe(jshint())
    .pipe(jsHintCsvReporter);
});

gulp.task('test', function (exit) {
  jasmineLogFileReset();
  return gulp.src([specs])
  .pipe(
    jasmine(
      {
        verbose : true,
        includeStackTrace : true
        //reporter: jasmineCsvReporter
      }
    )
  );
  // .on('error', function () {
  //   console.log('EXIT WITH ERROR')
  //   process.exit(1) // Exit for general errors
  // })
  // .on('end', function () {
  //   console.log('EXIT')
  //   process.exit(0) // Success exit
  // }); 
});

gulp.task('default', ['compile-ts', 'test']);

gulp.task('watch', ['compile-ts'], function() {
  return gulp.watch(allSrc, ['compile-ts', 'test']);
});

gulp.task('pack', shell.task([
  'npm pack'
]))

gulp.task('publish', shell.task([
  'npm publish'
]))
var tsLintLogFile = './tslint-report.csv';
var tsLintLogFileDelimiter = ', ';
var tsLintLogFileReset = function (){
  fs.exists(
    tsLintLogFile, 
    function(exists) {
      if(exists) {
        fs.unlinkSync(tsLintLogFile);
      }
      var line = 'Path' +
      tsLintLogFileDelimiter + 'Rule' +
      tsLintLogFileDelimiter + 'Failure' +
      tsLintLogFileDelimiter + 'Line' +
      tsLintLogFileDelimiter + 'Character' +
      '\r\n';
      fs.appendFileSync(
        tsLintLogFile, 
        line, 
        encoding='utf8');
    }
  );
}
var tsLintCsvReporter = function (output, file, options) {
  for (var i = 0; i < output.length; i++) {
    var err = output[i];
    var line = file.path +
      tsLintLogFileDelimiter + err.ruleName +
      tsLintLogFileDelimiter + err.failure +
      tsLintLogFileDelimiter + err.startPosition.line +
      tsLintLogFileDelimiter + err.startPosition.character + 
      '\r\n';
    //console.log(line);
    fs.appendFileSync(
      tsLintLogFile, 
      line, 
      encoding='utf8');
  }
};

var jasmineLogFile = './jasmine-report.csv';
var jasmineLogFileDelimiter = ', ';
var jasmineLogFileReset = function(){
  fs.exists(
    jasmineLogFile, 
    function(exists) {
      if(exists) {
        fs.unlinkSync(jasmineLogFile);
      }
      var line = 'Description' + 
        jasmineLogFileDelimiter + 'Status' +
        jasmineLogFileDelimiter + 'Error' +
        jasmineLogFileDelimiter + 'StackTrace' +
        '\r\n';
      fs.appendFileSync(
        jasmineLogFile, 
        line, 
        encoding='utf8');
    }
  );
}

var jasmineCsvReporter = {
  specDone: function(result) {
    if(result.status === 'passed'){
        var line = result.description + jasmineLogFileDelimiter  +
          result.status + jasmineLogFileDelimiter  +
          jasmineLogFileDelimiter  +
          '\r\n';
         fs.appendFileSync(
          jasmineLogFile, 
          line, 
          encoding='utf8');
    } else {
      for(var i = 0; i < result.failedExpectations.length; i++) {
        var line = result.description + jasmineLogFileDelimiter  +
          result.status +  jasmineLogFileDelimiter  +
          result.failedExpectations[i].message + jasmineLogFileDelimiter  +
           result.failedExpectations[i].stack.split('\n').join() +
          '\r\n';
         fs.appendFileSync(
          jasmineLogFile, 
          line, 
          encoding='utf8');
      }
    }
  }
};


var jsHintLogFile = './jshint-report.csv';
var jsHintLogFileDelimiter = ', ';
var jsLintLogFileReset = function (){
  fs.exists(
    jsHintLogFile, 
    function(exists) {
      if(exists) {
        fs.unlinkSync(jsHintLogFile);
      }
      var line = 'Path' +
      jsHintLogFileDelimiter + 'Rule' +
      jsHintLogFileDelimiter + 'Failure' +
      jsHintLogFileDelimiter + 'Line' +
      jsHintLogFileDelimiter + 'Character' +
      '\r\n';
      fs.appendFileSync(
        jsHintLogFile, 
        line, 
        encoding='utf8');
    }
  );
}
var jsHintCsvReporter = map(function (file, cb) {
  if (!file.jshint.success) {
    console.log('JSHINT fail in '+file.path);
    file.jshint.results.forEach(function (err) {
      if (err) {
        var line = file.path + ' ' + jsHintLogFileDelimiter + 
          err.error.code + ' ' + jsHintLogFileDelimiter + 
          err.error.reason + ' ' + jsHintLogFileDelimiter + 
          err.error.line + ' ' + jsHintLogFileDelimiter + 
          err.error.character + ' ' + jsHintLogFileDelimiter + 
          '\r\n';
        //console.log(line); 
        fs.appendFileSync(
          jsHintLogFile, 
          line, 
          encoding='utf8');
      }
    });
  }
  cb(null, file);
});