const { src, dest, parallel, series, watch } = require("gulp");
const del = require("del");
const sass = require(`gulp-sass`);
//const concat          = require('gulp-concat');
const autoprefixer = require("gulp-autoprefixer");
const clean = require("gulp-clean");
const merge = require("merge-stream");
const newer = require("gulp-newer");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const imagemins = require("imagemin");
const imageminWebp = require("imagemin-webp");
//const inject          = require('gulp-inject');
const injectPartials = require("gulp-inject-partials");
const minify = require("gulp-minify");
const cssmin = require("gulp-cssmin");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify");
const debug = require("gulp-debug");
const browserSync = require("browser-sync").create();

const SOURCEPATH = {
  sassSource: "tpl/scss/*.scss",
  htmlSource: "tpl/*.html",
  htmlPartialSource: "tpl/partial/*.html",
  jsSource: "tpl/js/**",
  imgSource: "tpl/images/**"
};

const APPPATH = {
  root: "app/",
  css: "app/assets/css",
  js: "app/assets/js",
  img: "app/assets/images",
  fonts: "app/assets/webfonts",
  plugins: "app/assets/js/plugins",
  bundle: "app/assets/js/bundle"
};

let cleanAll;

cleanAll = () => del([APPPATH.css, APPPATH.js, APPPATH.img, APPPATH.fonts]);

function sassFile() {
  return src(SOURCEPATH.sassSource + "/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(dest(APPPATH.css));
}

function index() {
  return (
    src(SOURCEPATH.htmlSource)
      //var sources = gulp.src(['app/assets/js/*.js', 'app/assets/css/*.css'], {read: false})
      .pipe(debug())
      .pipe(injectPartials())
      //return target.pipe(inject(sources))
      .pipe(dest(APPPATH.root))
  );
}

function imagewebp() {
  imagemins(["tpl/images/*.{jpg,png}"], "app/assets/images", {
    use: [imageminWebp({ quality: 50 })]
  }).then(() => {
    console.log("Images optimized");
  });
}

function images() {
  return src(SOURCEPATH.imgSource)
    .pipe(newer(APPPATH.img))
    .pipe(imagemin())
    .pipe(webp())
    .pipe(sourcemaps.init())
    .pipe(dest(APPPATH.img));
}

function compress() {
  return src(SOURCEPATH.jsSource)
    .pipe(
      minify({
        ignoreFiles: [".combo.js", "-min.js"]
      })
    )
    .pipe(uglify())
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write("./maps"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest(APPPATH.js));
}

function compresscss() {
  let bootstrapCSS = src("./node_modules/bootstrap/dist/css/bootstrap.css");
  //const owlCarouselCSS = src('./node_modules/owl.carousel/dist/assets/owl.carousel.css')
  let sassFiles;

  sassFiles = src(SOURCEPATH.sassSource)
    .pipe(autoprefixer())
    .pipe(sass({ oupPutStyle: "compressed" }).on("error", sass.logError));
  return (
    merge(bootstrapCSS, sassFiles)
      //.pipe(concat('app.css'))
      .pipe(sourcemaps.init())
      //.pipe(sourcemaps.write('./maps'))
      .pipe(cssmin())
      .pipe(rename({ suffix: ".min" }))
      .pipe(dest(APPPATH.css))
  );
}

function bundleJS() {
  return src([
    "./node_modules/jquery/dist/jquery.js",
    "./node_modules/bootstrap/dist/js/bootstrap.js"
  ])
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write("./maps"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(
      minify({
        ext: {
          src: "-debug.js",
          min: ".js"
        },
        exclude: ["tasks"],
        ignoreFiles: [".combo.js", "-min.js"]
      })
    )
    .pipe(dest(APPPATH.bundle));
}

function pluginJS() {
  return src([])
    .pipe(
      minify({
        ignoreFiles: [".combo.js", "-min.js"]
      })
    )
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write("./maps"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest(APPPATH.plugins));
}

function reload(done) {
  browserSync.reload();
  done();
}

function serve(done) {
  browserSync.init(
    [APPPATH.css + "/*.css", APPPATH.root + "*.html", APPPATH.js + "*.js"],
    {
      server: {
        baseDir: APPPATH.root
      }
    }
  );
}

function watchFiles() {
  watch(SOURCEPATH.sassSource, compresscss);
  watch(SOURCEPATH.htmlSource, index);
  watch(SOURCEPATH.jsSource, compress, bundleJS);
  watch(SOURCEPATH.imgSource, images);
}

exports.cleanAll = cleanAll;
//exports.watchFiles = watchFiles;
// exports.sassFile = sassFile;
// exports.index = index;
// exports.images = images;
// exports.compress = compress;
// exports.compresscss = compresscss;
// exports.bundleJS = bundleJS;
// exports.pluginJS = pluginJS;
exports.default = watchFiles;
exports.build = parallel(
  sassFile,
  index,
  images,
  compress,
  compresscss,
  bundleJS
);
exports.server = parallel(serve);
