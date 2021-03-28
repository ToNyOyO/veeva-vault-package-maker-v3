/******************************************************************************************************
 *
 * For any of this to work you need to create a config.json in the project root
 * Add an empty object to the file like so... {}
 *
 * Then run "gulp setup" to pre-generate the required fields
 *
 * This default json will be used to generate the csv file for Vault using "gulp vaultcsv"
 *
 * */

//@ToDo: possibly import the menu from a file? https://github.com/reinerBa/gulp-tag-content-replace

const gulp = require('gulp');
const { series } = require('gulp');
const fs = require('fs');
const glob = require("glob");
const path = require('path');
const jsonfile = require('jsonfile'); // do stuff to json files
const write = require('write'); // write to file
const rename = require('gulp-rename'); // rename a file in stream
const less = require('gulp-less'); // combine LESS and export as CSS
const sourcemaps = require('gulp-sourcemaps'); // create sourcemaps for css
const cleanCSS = require('gulp-clean-css'); // minify CSS
const uglify = require('gulp-uglify'); // minify JS
const zip = require('gulp-zip'); // make a ZIP
const rimraf = require('rimraf'); // delete a folder that contains files
const replace = require('gulp-replace'); // string replace in pipe
const inject = require('gulp-inject-string'); // append/prepend/wrap/before/after/beforeEach/afterEach/replace
const imageResize = require('gulp-image-resize');
const clean = require('gulp-clean'); // delete files/folders

const htmlFiles = glob.sync('./source/*.html');
let buildForDist = false;
let config = {};

try {
    config = require('./config.json');
} catch (ex) {

    (async () => {
        await write('./config.json', "{}", {}, function () {});
    })();

    console.log("\x1b[31m%s\x1b[0m", "\r\n>> Hey! You need to run 'gulp setup' then enter the Veeva required data in ./config.json\r\n");
}

function defaultTask(cb) {
    if ('presentationName' in config) {
        gulp.watch([
            './source/**/*.html',
            './source/shared/less/**/*.less',
            './source/shared/js/*.js',
            '!./source/shared/js/*.min.js'
        ], build).on('end', function() {console.log('test')});
    }

    cb();
}

/**********************************************************************************************************
 * setup the basic project structure
 *
 *    > gulp setup --project "project name"
 */
function setup(cb) {

    // copy config file
    gulp.src('./templates/template-config.json')
        .pipe(rename('config.json'))
        .pipe(gulp.dest('./'));

    // copy keymessages config file
    gulp.src('./templates/template-keymessages.json')
        .pipe(rename('keymessages.json'))
        .pipe(gulp.dest('./'));

    // copy .gitignore file
    gulp.src('./templates/.gitignore')
        .pipe(gulp.dest('./'));

    // copy shared folder structure
    gulp.src(['./templates/shared/**', '!./templates/shared/less/keymessages/less-template-file.less'])
        .pipe(gulp.dest('./source/shared'));

    // create previews folder
    gulp.src('*.*', {read: false})
        .pipe(gulp.dest('./source/previews'));

    // create fonts folder
    gulp.src('*.*', {read: false})
        .pipe(gulp.dest('./source/shared/fonts'));

    // create partials folder
    gulp.src('./templates/template-nav.html')
        .pipe(rename('nav.html'))
        .pipe(gulp.dest('./source/partials'));

    // create build folder
    gulp.src('*.*', {read: false})
        .pipe(gulp.dest('./build'));

    // create dist folder
    gulp.src('*.*', {read: false})
        .pipe(gulp.dest('./dist'));

    // create keymessages folder
    gulp.src('*.*', {read: false})
        .pipe(gulp.dest('./keymessages'));

    cb();
}


/**********************************************************************************************************
 * add a new key message to the project using...
 *
 *    > gulp keymessage --new "key message name"
 *
 *  Does not check for existing files!
 */
function keymessagev2(cb) {

    if (checkConfig(config, true)) {
        cb();
        return;
    }

    let newFileName = arg.new.replace(/ /g, "-");
    let presFileName = config.presentationName.replace(/ /g, "-");
    let sharedFileName = presFileName + '-shared-resource';
    let presSharedName = config.presentationName;
    let kmDataPres = {}, kmDataShared = {}, kmData = {};
    let addPresShared = false;

    jsonfile.readFile('./keymessages.json', function (err, obj) {
        if (err) console.error(err);

        ///> add key message(s) to keymessages.json

        if (Object.keys(obj).length === 0 && obj.constructor === Object) {

            // append new key message to obj
            obj[presSharedName] = true;
            obj[presSharedName + ' shared resource'] = true;

            // write out to file: pres
            jsonfile.writeFile('./keymessages.json', obj, { spaces: 4, EOL: '\r\n' }, function (err) {
                if (err) console.error(err);
            });

            // create key message config file
            kmDataPres = templateKMdata('Presentation', '', '',
                config.prefix, presSharedName, config.externalId,
                config.sharedResourceExternalId, config.productName,
                config.countryName, '', config.forEngage, config.countryTPI, config.language);

            // create key message config file
            kmDataShared = templateKMdata('Shared', '', '',
                config.prefix, presSharedName + ' shared resource', config.externalId,
                config.sharedResourceExternalId, config.productName,
                config.countryName, sharedFileName, config.forEngage, config.countryTPI, config.language);

            addPresShared = true;
        }
    });

    setTimeout(function(e) {
        jsonfile.readFile('./keymessages.json', function (err, obj) {
            if (err) console.error(err);

            obj[arg.new] = true;

            // write out to file: key message
            jsonfile.writeFile('./keymessages.json', obj, { spaces: 4, EOL: '\r\n' }, function (err) {
                if (err) console.error(err);
            });

            ///> create [keymessage].json file(s)

            // copy new template
            gulp.src('./templates/template-keymessage.html')
                .pipe(inject.replace('ADD PAGE ID HERE', arg.new.replace(/-/g, " ").toCamelCase()))
                .pipe(rename(newFileName + '.html'))
                .pipe(gulp.dest('./source/'));

            // add new previews
            gulp.src('./templates/previews/*')
                .pipe(gulp.dest('./source/previews/' + newFileName));

            // add new less template
            gulp.src('./templates/shared/less/keymessages/less-template-file.less')
                .pipe(inject.replace('PAGE NAME', arg.new))
                .pipe(inject.replace('PageName', arg.new.replace(/-/g, " ").toCamelCase()))
                .pipe(rename(newFileName + '.less'))
                .pipe(gulp.dest('./source/shared/less/keymessages/'));

            // append new less template @import to default.less
            gulp.src('./source/shared/less/default.less')
                .pipe(inject.append('\r\n@import "keymessages/' + newFileName + '.less";'))
                .pipe(gulp.dest('./source/shared/less/'));

            // add new less template
            gulp.src('./templates/shared/less/keymessages/less-template-file.anims.less')
                .pipe(inject.replace('PAGE NAME', arg.new))
                .pipe(inject.replace('PageName', arg.new.replace(/-/g, " ").toCamelCase()))
                .pipe(rename(newFileName + '.anims.less'))
                .pipe(gulp.dest('./source/shared/less/keymessages/'));

            // append new less template @import to anims.less
            gulp.src('./source/shared/less/anims.less')
                .pipe(inject.append('\r\n@import "keymessages/' + newFileName + '.anims.less";'))
                .pipe(gulp.dest('./source/shared/less/'));

            // insert JS link into app.js
            let js = fs.readFileSync('./templates/template-keymessage.js', 'utf8');
            js = js.replace(/FILENAME/g, newFileName).replace('METHODNAME', arg.new.replace(/-/g, " ").toCamelCase());

            gulp.src('./source/shared/js/app.js')
                .pipe(inject.before('/** INSERT NEW KEYMESSAGE LINK HERE **/', js + '    '))
                .pipe(gulp.dest('./source/shared/js/'));

            // insert reference into nav partial
            if (!arg.notnav) {
                gulp.src('./source/partials/nav.html')
                    .pipe(inject.before('<!-- NEW ITEM -->', '\r\n    <li><a href="#" class="goTo-' + arg.new.replace(/-/g, " ").toCamelCase() + '">' + arg.new + '</a></li>\r\n'))
                    .pipe(gulp.dest('./source/partials'));
            }

            // create key message config file
            kmData = templateKMdata('Slide', '', '',
                config.prefix, arg.new, config.externalId,
                config.sharedResourceExternalId, config.productName,
                config.countryName, newFileName, config.forEngage, config.countryTPI, config.language);

            setTimeout(function() {
                //  - create the json file
                jsonfile.writeFile('./keymessages/' + newFileName + '.json', kmData, { spaces: 4, EOL: '\r\n' }, function (err) {
                    if (err) console.error(err);
                });

                if (addPresShared) {
                    jsonfile.writeFile('./keymessages/' + presFileName + '.json', kmDataPres, { spaces: 4, EOL: '\r\n' }, function (err) {
                        if (err) console.error(err);
                    });
                    jsonfile.writeFile('./keymessages/' + sharedFileName + '.json', kmDataShared, { spaces: 4, EOL: '\r\n' }, function (err) {
                        if (err) console.error(err);
                    });
                }
            }, 250);

        });

        cb();
    }, 500);
}


/**********************************************************************************************************
 * regen key messages using...
 *
 *    > gulp regen
 *
 */
function regenerateKeyMessages(cb) {

    if (checkConfig(config, false)) {
        cb();
        return;
    }

    //let newFileName = arg.new.replace(/ /g, "-");
    let presFileName = config.presentationName.replace(/ /g, "-");
    let sharedFileName = presFileName + '-shared-resource';
    let presSharedName = config.presentationName;
    let kmDataPres = {}, kmDataShared = {}, kmData = {};

    // create key message config file
    kmDataPres = templateKMdata('Presentation', '', '',
        config.prefix, presSharedName, config.externalId,
        config.sharedResourceExternalId, config.productName,
        config.countryName, '', config.forEngage, config.countryTPI, config.language);

    //  - create the json file
    jsonfile.writeFile('./keymessages/' + presFileName + '.json', kmDataPres, { spaces: 4, EOL: '\r\n' }, function (err) {
        if (err) console.error(err);
    });

    // create key message config file
    kmDataShared = templateKMdata('Shared', '', '',
        config.prefix, presSharedName + ' shared resource', config.externalId,
        config.sharedResourceExternalId, config.productName,
        config.countryName, sharedFileName, config.forEngage, config.countryTPI, config.language);

    //  - create the json file
    jsonfile.writeFile('./keymessages/' + sharedFileName + '.json', kmDataShared, { spaces: 4, EOL: '\r\n' }, function (err) {
        if (err) console.error(err);
    });


    let loadedKMs = require('./keymessages.json');

    setTimeout(function() {
        let count = 0;
        for (const A of Object.entries(loadedKMs)) {
            let km = A[0];

            if (count >= 2) {
                let newFileName = km.replace(/ /g, "-");

                // create key message config file
                kmData = templateKMdata('Slide', '', '',
                    config.prefix, km, config.externalId,
                    config.sharedResourceExternalId, config.productName,
                    config.countryName, newFileName, config.forEngage, config.countryTPI, config.language);

                //  - create the json file
                jsonfile.writeFile('./keymessages/' + newFileName + '.json', kmData, { spaces: 4, EOL: '\r\n' }, function (err) {
                    if (err) console.error(err);
                });
            }
            count++;
        }

        cb();
    }, 1000);
}


/**********************************************************************************************************
 * add a new key message to the project using...
 *
 *    > gulp link --km "key-message-name.zip" --method "nameOfMethod" --id "presentation-ID"
 *
 */
function externalLink(cb) {

    let error = false;

    if (arg.method === undefined) {
        console.log("\x1b[31m%s\x1b[0m", "requires '--method'");
        error = true;
    }
    if (arg.km === undefined) {
        console.log("\x1b[31m%s\x1b[0m", "requires '--km'");
        error = true;
    }
    if (arg.id === undefined) {
        console.log("\x1b[31m%s\x1b[0m", "requires '--id'");
        error = true;
    }

    if (error) {
        console.log("\x1b[31m%s\x1b[0m", 'EXAMPLE: > gulp link --km "key-message-name.zip" --method "nameOfMethod" --id "123-presentation-ID"');
        cb();
        return;
    }

    let methodName = arg.method.replace(/-/g, " ").toCamelCase();
    let keyMessage = (arg.km.indexOf('.zip') !== -1) ? arg.km : arg.km + '.zip';
    let presID = arg.id;

    // insert JS link into app.js
    let js = fs.readFileSync('./templates/template-link-to-pres.js', 'utf8');
    js = js.replace(/KEYMESSAGE/g, keyMessage).replace(/PRESENTATION/g, presID).replace('METHODNAME', methodName);

    gulp.src('./source/shared/js/app.js')
        .pipe(inject.before('/** INSERT LINK TO OTHER PRES HERE **/', js + '    '))
        .pipe(gulp.dest('./source/shared/js/'));

    cb();
}


function generatePreviews(cb) {

    // loop through previews folders
    // resize grab and rename as poster
    // copy and resize poster and rename as thumb

    console.log('creating posters...');
    gulp.src(['./source/previews/*/*.{PNG,png,JPG,jpg}', '!./source/previews/*/poster.png', '!./source/previews/*/thumb.png'])
        .pipe(imageResize({
            //imageMagick: true,
            width: 1024,
            height: 768,
            quality: 5,
            format: 'png'
        }))
        .pipe(rename(function (path){
            path.basename = 'poster';
        }))
        .pipe(gulp.dest('./source/previews'))
        .on('end', function() {

            console.log('creating thumbs...');
            gulp.src(['./source/previews/*/*.{PNG,png,JPG,jpg}', '!./source/previews/*/poster.png', '!./source/previews/*/thumb.png'])
                .pipe(imageResize({
                    //imageMagick: true,
                    width: 200,
                    height: 150,
                    quality: 3,
                    format: 'png'
                }))
                .pipe(rename(function (path){
                    path.basename = 'thumb';
                }))
                .pipe(gulp.dest('./source/previews'))
                .on('end', function () {

                    console.log('tidying up...');
                    gulp.src(['./source/previews/*/*.{PNG,png,JPG,jpg}', '!./source/previews/*/poster.png', '!./source/previews/*/thumb.png'], {read: false})
                        .pipe(clean())
                        .pipe(gulp.dest('./source/previews'))
                        .on('end', function () {
                            cb();
                        });
                })
        });
}


/**********************************************************************************************************
 * rename a key message in the project using...
 *
 *    > gulp rename --from "Key message" --to "New key message"
 *
 * Does not check for existing files!
 */
function renameKeymessage(cb) {

    let error = false;

    if (arg.from === undefined) {
        console.log("\x1b[31m%s\x1b[0m", "requires '--from'");
        error = true;
    }
    if (arg.to === undefined) {
        console.log("\x1b[31m%s\x1b[0m", "requires '--to'");
        error = true;
    }

    if (error) {
        console.log("\x1b[31m%s\x1b[0m", 'EXAMPLE: > gulp rename --from "Key message name" --to "New key message name"');
        cb();
        return;
    }

    let oldFileName = arg.from.replace(/ /g, "-");
    let newFileName = arg.to.replace(/ /g, "-");
    let oldMethodName = arg.from.replace(/-/g, " ").toCamelCase();
    let newMethodName = arg.to.replace(/-/g, " ").toCamelCase();

    // update default LESS and rename file
    gulp.src('./source/shared/less/keymessages/' + oldFileName + '.less')
        .pipe(inject.replace(' ' + arg.from, ' ' + arg.to))
        .pipe(inject.replace('#' + arg.from.toCamelCase(), '#' + arg.to.toCamelCase()))
        .pipe(rename(newFileName + '.less'))
        .pipe(gulp.dest('./source/shared/less/keymessages/'))
        .on('end', function() {
            gulp.src('./source/shared/less/keymessages/' + oldFileName + '.less', {read: false}).pipe(clean());
        });

    // update default.less
    gulp.src('./source/shared/less/default.less')
        .pipe(inject.replace('@import "keymessages/' + oldFileName, '@import "keymessages/' + newFileName))
        .pipe(gulp.dest('./source/shared/less/'));

    // update anims LESS and rename file
    gulp.src('./source/shared/less/keymessages/' + oldFileName + '.anims.less')
        .pipe(inject.replace(' ' + arg.from, ' ' + arg.to))
        .pipe(inject.replace('#' + arg.from.toCamelCase(), '#' + arg.to.toCamelCase()))
        .pipe(rename(newFileName + '.anims.less'))
        .pipe(gulp.dest('./source/shared/less/keymessages/'))
        .on('end', function() {
            gulp.src('./source/shared/less/keymessages/' + oldFileName + '.anims.less', {read: false}).pipe(clean());
        });

    // update anims.less
    gulp.src('./source/shared/less/anims.less')
        .pipe(inject.replace('@import "keymessages/' + oldFileName, '@import "keymessages/' + newFileName))
        .pipe(gulp.dest('./source/shared/less/'));

    // update app.js
    gulp.src('./source/shared/js/app.js')
        .pipe(inject.replace("goTo-" + oldMethodName, "goTo-" + newMethodName))
        .pipe(inject.replace("'" + oldFileName + ".zip', ''", "'" + newFileName + ".zip', ''"))
        .pipe(inject.replace("href = '" + oldFileName + ".html'", "href = '" + newFileName + ".html'"))
        .pipe(gulp.dest('./source/shared/js/'));

    // rename goTo refs in all html files
    gulp.src('./source/*.html')
        .pipe(inject.replace('goTo-' + oldMethodName, 'goTo-' + newMethodName))
        .pipe(gulp.dest('./source/'))
        .on('end', function() {

            // update classname + goTo in HTML and rename HTML
            gulp.src('./source/' + oldFileName + '.html')
                .pipe(inject.replace('<body id="' + arg.from.toCamelCase() + '">', '<body id="' + arg.to.toCamelCase() + '">'))
                .pipe(rename(newFileName + '.html'))
                .pipe(gulp.dest('./source/'))
                .on('end', function() {
                    gulp.src('./source/' + oldFileName + '.html', {read: false}).pipe(clean()); //ToDo: this line could be error
                });
        });

    // update goTo in NAV
    gulp.src('./source/partials/nav.html')
        .pipe(inject.replace('goTo-' + oldMethodName, 'goTo-' + newMethodName))
        .pipe(gulp.dest('./source/partials'));

    // update keymessages.json
    gulp.src('./keymessages.json')
        .pipe(inject.replace('"' + arg.from + '":', '"' + arg.to + '":'))
        .pipe(gulp.dest('./'));

    // update [key message].json and rename file
    gulp.src('./keymessages/' + oldFileName + '.json')
        .pipe(inject.replace('"name__v": "' + config.prefix.toUpperCase() + ' - ' + arg.from + '"', '"name__v": "' + config.prefix.toUpperCase() + ' - ' + arg.to + '"'))
        .pipe(inject.replace('"slide.filename": "' + oldFileName + '.zip"', '"slide.filename": "' + newFileName + '.zip"'))
        .pipe(rename(newFileName + '.json'))
        .pipe(gulp.dest('./keymessages/'))
        .on('end', function() {
            gulp.src('./keymessages/' + oldFileName + '.json', {read: false}).pipe(clean());
        });

    // rename previews folder
    gulp.src('./source/previews/' + oldFileName)
        .pipe(rename(newFileName))
        .pipe(gulp.dest('./source/previews/'))
        .on('end', function() {
            gulp.src('./source/previews/' + oldFileName + '/*')
                .pipe(gulp.dest('./source/previews/' + newFileName))
                .on('end', function() {
                    gulp.src('./source/previews/' + oldFileName, {read: false}).pipe(clean());
                });
        });

    cb();
}

/**********************************************************************************************************
 * build the files ready for viewing in browser
 *
 *    > gulp build
 *
 * Does not check for existing files!
 */
function build(cb) {

    let epoch = new Date().getTime();

    gulp.src('./build/*', {read: false})
        .pipe(clean())
        .pipe(gulp.dest('./build'))
        .on('end', function () {

            gulp.src('./source/shared/less/default.less')
                .pipe(sourcemaps.init())
                .pipe(less())
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('./source/shared/less'))
                .on('end', function() {

                    console.log('> saving out min.css...');
                    gulp.src('./source/shared/less/default.css')
                        .pipe(cleanCSS({compatibility: 'ie8'}))
                        .pipe(rename(function (path) {
                            //path.basename = 'default-' + epoch;
                            path.basename = (buildForDist) ? 'default' : 'default-' + epoch;
                            path.extname = '.min.css'
                        }))
                        .pipe(gulp.dest('./build/shared/css'))
                        .on('end', function() {

                            gulp.src('./source/shared/less/anims.less')
                                .pipe(sourcemaps.init())
                                .pipe(less())
                                .pipe(sourcemaps.write('./'))
                                .pipe(gulp.dest('./source/shared/less'))
                                .on('end', function() {

                                    console.log('> saving out min.css...');
                                    gulp.src('./source/shared/less/anims.css')
                                        .pipe(cleanCSS({compatibility: 'ie8'}))
                                        .pipe(rename(function (path) {
                                            //path.basename = 'default-' + epoch;
                                            path.basename = (buildForDist) ? 'anims' : 'anims-' + epoch;
                                            path.extname = '.min.css'
                                        }))
                                        .pipe(gulp.dest('./build/shared/css'))
                                        .on('end', function() {

                                            console.log('> saving out min.js...');
                                            gulp.src(['./source/shared/js/*.js', '!./source/shared/js/app.js', '!./source/shared/js/*.min.js'])
                                                .pipe(uglify())
                                                .pipe(rename(function (path) {path.extname = '.min.js'}))
                                                .pipe(gulp.dest('./build/shared/js'))
                                                .on('end', function() {

                                                    console.log('> saving out app.min.js...');
                                                    gulp.src(['./source/shared/js/app.js', '!./source/shared/js/*.min.js'])
                                                        .pipe(uglify())
                                                        .pipe(rename(function (path) {
                                                            //path.basename = 'app-' + epoch;
                                                            path.basename = (buildForDist) ? 'app' : 'app-' + epoch;
                                                            path.extname = '.min.js'
                                                        }))
                                                        .pipe(gulp.dest('./build/shared/js'))
                                                        .on('end', function() {

                                                            console.log('> copying other min.js files...');
                                                            // also copy any .min.js files from source
                                                            gulp.src('./source/shared/js/*.min.js')
                                                                .pipe(gulp.dest('./build/shared/js'))
                                                                .on('end', function() {

                                                                    console.log('> copying fonts...');
                                                                    // copy fonts
                                                                    gulp.src('./source/shared/fonts/**')
                                                                        .pipe(gulp.dest('./build/shared/fonts'))
                                                                        .on('end', function() {

                                                                            console.log('> copying images...');
                                                                            // copy images
                                                                            gulp.src('./source/shared/imgs/**')
                                                                                .pipe(gulp.dest('./build/shared/imgs'))
                                                                                .on('end', function() {

                                                                                    console.log('> inserting css/js into html files and copying...');

                                                                                    // insert JS link into app.js
                                                                                    let nav = fs.readFileSync('./source/partials/nav.html', 'utf8');
                                                                                    nav = nav.replace(/<!-- NEW ITEM -->/g, '');

                                                                                    let withStamp = (buildForDist) ? '' : '-' + epoch;

                                                                                    // copy html files
                                                                                    gulp.src('./source/*.html')
                                                                                        .pipe(inject.replace('<!-- INSERT CSS HERE  -->', '<link rel="stylesheet" href="./shared/css/default' + withStamp + '.min.css">'))
                                                                                        .pipe(inject.replace('<!-- INSERT CSS ANIMS HERE  -->', '<script>var cssAnimsFile = "./shared/css/anims' + withStamp + '.min.css";</script>'))
                                                                                        .pipe(inject.replace('<!-- INSERT JS HERE  -->', '<script src="./shared/js/app' + withStamp + '.min.js"></script>'))
                                                                                        .pipe(inject.replace('<!-- INSERT NAV HERE  -->', nav + '    '))
                                                                                        .pipe(gulp.dest('./build'))
                                                                                        .on('end', function() {

                                                                                            cb();
                                                                                        });
                                                                                });
                                                                        });
                                                                });
                                                        });
                                                });

                                        });
                                });

                        });
                });
        });
}

function setAsNotPublished(cb) {

    buildForDist = false;

    gulp.src('./build/*', {read: false})
        .pipe(clean())
        .pipe(gulp.dest('./build'))
        .on('end', function () {

            // rebuild  js for dist
            gulp.src(['./source/shared/js/app.js'])
                .pipe(replace('isPublished = true', 'isPublished = false'))
                .pipe(gulp.dest('./source/shared/js'))
                .on('end', function () {

                    cb();
                });
        });
}

function setAsPublished(cb) {

    buildForDist = true;

    gulp.src('./build/*', {read: false})
        .pipe(clean())
        .pipe(gulp.dest('./build'))
        .on('end', function () {

            // rebuild  js for dist
            gulp.src(['./source/shared/js/app.js'])
                .pipe(replace('isPublished = false', 'isPublished = true'))
                .pipe(gulp.dest('./source/shared/js'))
                .on('end', function () {

                    cb();
                });
        });
}

function copyCssToDist (cb) {
    gulp.src('./build/shared/css/*')
        .pipe(gulp.dest('./dist/TMP/shared/css'))
        .on('end', function () {
            cb();
        });
}

function copyJsToDist (cb) {
    gulp.src('./build/shared/js/*')
        .pipe(gulp.dest('./dist/TMP/shared/js'))
        .on('end', function () {
            cb();
        });
}

function copyFontsToDist (cb) {
    gulp.src('./source/shared/fonts/**')
        .pipe(gulp.dest('./dist/TMP/shared/fonts'))
        .on('end', function () {
            cb();
        });
}

function copyImagesToDist (cb) {
    gulp.src('./source/shared/imgs/**')
        .pipe(gulp.dest('./dist/TMP/shared/imgs'))
        .on('end', function () {
            cb();
        });
}

function copyPreviewsToDist (cb) {
    gulp.src('./source/previews/*/*')
        .pipe(gulp.dest('./dist/TMP/keymessages'))
        .on('end', function () {
            cb();
        });
}

function copyHtmlToDist (cb) {
    glob.sync('./build/*.html').forEach(function (htmlFile) {
        gulp.src(htmlFile)
            .pipe(rename(function (path) {path.basename = 'index'}))
            .pipe(gulp.dest('./dist/TMP/keymessages/' + path.basename(htmlFile, '.html')));
    });

    setTimeout(function () {
        cb();
    }, 1200);
}

function zipKeyMessages (cb) {
    htmlFiles.forEach(function (htmlFile) {
        gulp.src( './dist/TMP/keymessages/' + path.basename(htmlFile, '.html') + '/*' )
            .pipe(zip(path.basename(htmlFile, '.html') + '.zip'))
            .pipe(gulp.dest('./dist'));
    });

    setTimeout(function () {
        cb();
    }, 1800);
}

function zipSharedFiles (cb) {
    gulp.src('./dist/TMP/shared/**')
        .pipe(zip(config.presentationName.replace(/ /g, "-") + '-shared-resource.zip'))
        .pipe(gulp.dest('./dist'))
        .on('end', function() {
            setTimeout(function () {
                rimraf('./dist/TMP', function () {  });

                cb();
            }, 2000);
        });
}

function generateCsv (cb) {
    // make the Vault MC Loader csv
    let loadedKMs = require('./keymessages.json');
    let addHeaders = true;
    let csvData = '';

    setTimeout(function() {
        for (const A of Object.entries(loadedKMs)) {
            let km = A[0];
            let allowKm = A[1];

            if (allowKm) {

                let dd = require('./keymessages/' + km.replace(/ /g, "-") + '.json');

                if (addHeaders) {
                    csvData = Object.keys(dd).toString() + '\r\n';
                    addHeaders = false;
                }
                csvData += Object.values(dd).toString() + '\r\n';
            }
        }

        // save to ./build/vault-mc-loader.csv
        (async () => {
            await write('./dist/vault-mc-loader.csv', csvData);
        })();

        cb();

    }, 1000);
}

exports.default = defaultTask;

exports.setup = setup;

exports.keymessage = keymessagev2;

exports.regen = regenerateKeyMessages;

exports.link = externalLink;

exports.previews = generatePreviews;

exports.rename = renameKeymessage;

exports.build = build;

exports.dist = series(
    setAsPublished,
    build,
    copyCssToDist,
    copyJsToDist,
    copyFontsToDist,
    copyImagesToDist,
    copyPreviewsToDist,
    copyHtmlToDist,
    zipKeyMessages,
    zipSharedFiles,
    generateCsv,
    setAsNotPublished,
    build
);


// template data for key message file
function templateKMdata(type, startDate, endDate, prefix, name_v, externalId,
                        sharedResourceExternalId, productName, countryName, newFileName,
                        forEngage, countryTPI, language) {

    let iosRes = '', disableActions = '', presTPI = '', presLang = '', title = '', lifecycle = '',
        mediaType = '', presProductName = '', presCountry = '', presExternalId = '', presExternalId_copy = '',
        training = '', hidden = '', shared = '', fieldsOnly = '';

    prefix = prefix.toUpperCase();

    if (type === 'Presentation') {
        presProductName = productName;
        presCountry = countryName;
        presTPI = countryTPI;
        presLang = language;
        presExternalId = presExternalId_copy = prefix + 'pres-' + externalId;
        lifecycle = 'Binder Lifecycle';
        training = hidden = fieldsOnly = 'FALSE';

        countryTPI = language = productName = countryName = externalId = sharedResourceExternalId = newFileName = '';
    }

    if (type === 'Slide') {
        lifecycle = 'CRM Content Lifecycle';
        externalId = prefix + 'pres-' + externalId;
        sharedResourceExternalId = prefix + 'sr-' + sharedResourceExternalId;
        newFileName = newFileName + ".zip";
        mediaType = 'HTML';
        title = prefix + " - " + name_v;
        iosRes = 'Scale To Fit';
        disableActions = 'Zoom';
    }

    if (type === 'Shared') {
        lifecycle = 'CRM Content Lifecycle';
        presExternalId = prefix + 'sr-' + sharedResourceExternalId;
        externalId = sharedResourceExternalId = '';
        newFileName = newFileName + ".zip";
        shared = 'TRUE';
    }

    return {
        "document_id__v" : "",
        "external_id__v" : presExternalId,
        "name__v" : prefix + " - " + name_v,
        "Create Presentation" : "FALSE",
        "Type" : type,
        "lifecycle__v" : lifecycle,
        "pres.crm_presentation_id__v": presExternalId_copy,
        "Presentation Link" : externalId,
        "Fields Only" : fieldsOnly,
        "pres.crm_training__v" : training,
        "pres.crm_hidden__v" : hidden,
        "pres.product__v.name__v" : presProductName,
        "pres.country__v.name__v" : presCountry,
        "pres.clm_content__v" : "TRUE",
        "pres.language__v": presLang,
        "pres.country_tpi__c": presTPI,
        "pres.engage_content__v": forEngage,
        "pres.crm_start_date__v" : startDate,
        "pres.crm_end_date__v" : endDate,
        "slide.name__v" : "",
        "slide.lifecycle__v" : "",
        "slide.crm_media_type__v" : mediaType,
        "slide.related_sub_pres__v" : "",
        "slide.related_shared_resource__v" : sharedResourceExternalId,
        "slide.ios_resolution__v": iosRes,
        "slide.crm_disable_actions__v" : disableActions,
        "slide.product__v.name__v" : productName,
        "slide.country__v.name__v" : countryName,
        "slide.language__v": language,
        "slide.country_tpi__c": countryTPI,
        "slide.filename" : newFileName,
        "slide.title__v": title,
        "slide.clm_content__v" : "TRUE",
        "slide.crm_shared_resource__v" : shared
    }
}

// run basic error check on config file before processing
function checkConfig(config, newKM) {
    let error = false;

    if (!('presentationName' in config) || config.presentationName === '') {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'presentationName'");
        error = true;
    }
    if (!('forEngage' in config) || config.forEngage === '') {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'forEngage'");
        error = true;
    }
    if (!('prefix' in config) || config.prefix === '') {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'prefix'");
        error = true;
    }
    if (!('externalId' in config) || config.externalId === '') {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'externalId'");
        error = true;
    }
    if (!('presentationStartDate' in config)) {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'presentationStartDate'");
        error = true;
    }
    if (!('presentationEndDate' in config)) {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'presentationEndDate'");
        error = true;
    }
    if (!('productName' in config) || config.productName === '') {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'productName'");
        error = true;
    }
    if (!('countryName' in config) || config.countryName === '') {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'countryName'");
        error = true;
    }
    if (!('countryTPI' in config) || config.countryTPI === '') {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'countryName'");
        error = true;
    }
    if (!('language' in config) || config.language === '') {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'countryName'");
        error = true;
    }
    if (!('sharedResourceExternalId' in config) || config.sharedResourceExternalId === '') {
        console.log("\x1b[31m%s\x1b[0m", "config requires 'sharedResourceExternalId'");
        error = true;
    }

    if (newKM && arg.new === undefined) {
        console.log("\x1b[31m%s\x1b[0m", 'EXAMPLE: > gulp keymessage --new "Key message name"');
        error = true;
    }

    return error;
}

// convert string to camelcase
String.prototype.toCamelCase = function() {
    return this
        .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/\^(.)/g, function($1) { return $1.toLowerCase(); });
}

// fetch command line arguments
const arg = (argList => {

    let arg = {}, a, opt, thisOpt, curOpt;
    for (a = 0; a < argList.length; a++) {

        thisOpt = argList[a].trim();
        opt = thisOpt.replace(/^\-+/, '');

        if (opt === thisOpt) {

            // argument value
            if (curOpt) arg[curOpt] = opt.replace(/([^a-z0-9_-]+)/gi, ' ').trim();
            curOpt = null;

        }
        else {

            // argument name
            curOpt = opt;
            arg[curOpt] = true;

        }

    }

    return arg;

})(process.argv);
