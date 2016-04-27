const gulp        = require('gulp');
const ngTemplates = require('gulp-ng-templates');
const fs          = require('fs');

gulp.task('html:templates', function () {
  gulp.src('src/**/*.html')
    .pipe(ngTemplates({
      filename: 'cc-templates.js',
      module:   'cc-templates',
      path:     function (path, base) {
        return path.replace(base, 'src/');
      }
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', function () {
  const templates = fs.readFileSync('./dist/cc-templates.js');
  const build     = fs.readFileSync('./dist/build.js');
  const html1     = '<!DOCTYPE html><html' +
                    ' xmlns="http://www.w3.org/1999/xhtml"><head><meta' +
                    ' charset="UTF-8"><base href="/"><title>Builds</title>';
  const html2     = '</head><body ng-app="eye"><app></app></body></html>';
  const target    = './dist/index.html';
  var svg = 'angular.module("cc-templates").run([\n  "$templateCache",' +
          ' function ($templateCache) {\n    $templateCache.put("src/svg/icons.svg", \'ICONS\');\n    $templateCache.put("src/common/brand-logo/brand-logo.svg", \'LOGO\');}]);';

  const icons = fs.readFileSync('./dist/svg/icons.svg').toString().replace(/\n/g, '');
  const logo = fs.readFileSync('./dist/common/brand-logo/brand-logo.svg').toString().replace(/\n/g, '');

  svg = svg.replace(/LOGO/, logo);
  svg = svg.replace(/ICONS/, icons);

  fs.writeFileSync(target, html1);
  fs.appendFileSync(target, "\n<script>\n");
  fs.appendFileSync(target, build);
  fs.appendFileSync(target, templates);
  fs.appendFileSync(target, svg);
  fs.appendFileSync(target, "\n</script>\n");
  fs.appendFileSync(target, html2);
});
