var sass = require('node-sass'),
    Datauri = require('datauri');

var DEBUG_RELEASE = false;

module.exports = function(grunt) {
grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
        options: {
            browserifyOptions: {
                noParse: [
                    'node_modules/jquery/release/jquery.js',
                    'node_modules/bluebird/js/browser/bluebird.js',
                    'node_modules/underscore/underscore.js'
                ],
                ignoreGlobals: true,
                // transform: [
                    // ['babelify', {
                        // ignore: /node_modules/,
                        // presets: ['es2015']
                    // }]
                // ],
                debug: true
            },
            watch: grunt.option('watchify'),
            keepAlive: false
        },
        main: {
            // options: {
                // require: ['babel-polyfill']
            // },
            files: {
                'public/app.js': ['src/env/dev.js', 'src/main.js'],
            }
        },
        release: {
            // options: {
                // require: ['babel-polyfill']
            // },
            browserifyOptions: {
                debug: DEBUG_RELEASE,
                ignoreGlobals: false,
                // transform: [
                    // ['babelify', {
                        // ignore: /node_modules/,
                        // presets: ['es2015']
                    // }]
                // ]
            },
            files: {
                'release/app.js': ['src/env/release.js', 'src/main.js'],
            }
        }
    },
    sass: {
        main: {
            options:{
                sourceMap: true,
                functions: {
                    'fileRev($path)': function(path){
                        return path;
                    },
                    'dataUri($path)': function(path){
                        return new sass.types.String(new Datauri(path.getValue()).toString());
                    }
                }
            },
            files: {
                'public/app.css': 'style/main.scss'
            }
        },
        release: {
            options: {
                functions: {
                    'fileRev($path)': function(path){
                        return new sass.types.String(fileRev(path.getValue()));
                    }
                }
            },
            files: {
                'release/app.css': 'style/main.scss'
            }
        }
    },
    autoprefixer: {
        main: {
            options: {
                map: true
            },
            files: {
                'public/app.css': 'public/app.css'
            }
        },
        release: {
            files: {
                'release/app.css': 'release/app.css'
            }
        }
    },
    ejs: {
        main: {
            options: {
                // meta: grunt.file.readJSON('templates/meta.json'),
                'pkg': '<%= pkg %>',
                dev: true,
                fileRev: function(s){ return s; },
                inline: function(s) { return fs.readFileSync('release/' + s); }
            },
            files: [
                {expand: true, dest:'public/', cwd: 'templates/', src:'index.html', filter: 'isFile', ext: '.html'}
            ]
        },
        release: {
            options: {
                // meta: grunt.file.readJSON('templates/meta.json'),
                'pkg': '<%= pkg %>',
                dev: false,
                fileRev: fileRev,
                inline: function(s) { return fs.readFileSync('release/' + s); }
            },
            files: [
                {expand: true, dest:'release/', cwd: 'templates/', src:'index.html', filter: 'isFile', ext: '.html'}
            ]
        }
    },
    jade: {
        main: {
            options: {
                data: {
                    // meta: grunt.file.readJSON('templates/meta.json'),
                    'pkg': '<%= pkg %>',
                    dev: true,
                    fileRev: function(s){ return s; }
                }
            },
            files: [
                {expand: true, dest:'public/', cwd: 'templates/', src:'index.jade', filter: 'isFile', ext: '.html'}
            ]
        },
        release: {
            options: {
                data: {
                    // meta: grunt.file.readJSON('templates/meta.json'),
                    'pkg': '<%= pkg %>',
                    dev: false,
                    fileRev: fileRev
                }
            },
            files: [
                {expand: true, dest:'release/', cwd: 'templates/', src:'index.jade', filter: 'isFile', ext: '.html'}
            ]
        }
    },
    // shell: {
    // },
    connect: {
        server: {
            options: {
                hostname: '*',
                base: 'public',
                //keepalive: true,
                livereload: true,
                //debug: true,
                open: grunt.option('open')
            }
        }
    },
    rsync: {
        options: {
            recursive: true
        },
        release: {
            options: {
                src: 'release/',
                dest: '/var/www/29a.ch/sandbox/2011/neonflames/',
                host: 'x.29a.ch',
                port: '22',
                deleteAll: false,
                dryRun: false
            }
        }
    },
    copy: {
        release: {
            files: [
                {expand: true, dest:'release/', cwd: 'public/', src:'**', filter: 'isFile'}
            ]
        }
    },
    cssmin: {
        release: {
            files: {'release/app.css': 'release/app.css'}
        }
    },
    uglify: {
        options: {
            report: 'min',
            banner: '/* <%= pkg.name %> <%= pkg.version %> <%= pkg.homepage %> */\n',
            screwIE8: true,
            sourceMap: DEBUG_RELEASE,
            //mangle: false,
            //compress: false,
            //beautify: true
        },
        release: {
            files: {
                'release/app.js': 'release/app.js',
            }
        }
    },
    compress: {
        release: {
            options: {
                mode: 'gzip'
            },
            files: [
                {
                    expand: true,
                    cwd: 'release/',
                    src: ['**/*.css', '**/*.js', '**/*.html', '**/*.json'],
                    dest: 'release/',
                    rename: function(dest, src) { return dest + src + '.gz'; }
                }
            ]
        }
    },
    cacheBust: {
        release: {
            options: {
                baseDir: 'release/',
                separator: '.cache-'
            },
            files: {
                src: ['release/index.html']
            }
        }
    },
    watch: {
        static: {
            files: ['**/*.css', '**/*.js', '**/*.html'],
            options: {
                livereload: true,
                cwd: 'public/'
            }
        },
        browserifymain: {
            files: ['src/**/*.js', 'src/*.js'],
            tasks: ['browserify:main'],
            options: {
                //spawn: true
            }
        },
        sassmain: {
            files: ['style/*'],
            tasks: ['sass:main', 'autoprefixer:main']
        },
        templates: {
            files: ['templates/**/*.jade'],
            tasks: ['jade:main']
        },
        ejs: {
            files: ['templates/**/*.html'],
            tasks: ['ejs:main']
        }
    }
});

var fs = require('fs'),
    crypto = require('crypto');

function fileRev(path){
    var filePath = 'release/' + path;
    if(!fs.existsSync(filePath)){
        return path;
    }
    var buffer = fs.readFileSync(filePath),
        hash = crypto.createHash('md5');
    
    hash.update(buffer);

    var digest = hash.digest('hex').slice(0, 16),
        filePathRev = filePath.replace(/([^.\/]+)$/, 'cache-' + digest + '.$1');
        
    if(!fs.existsSync(filePathRev)){
        fs.writeFileSync(filePathRev, buffer);
        console.log('Copied ' + filePath + ' to ' + filePathRev);
    }
    return filePathRev.replace(/^release\//, '');
}

if(grunt.option('watchify')){
    console.log('running in watchify mode');
    delete grunt.config.data.watch.browserifymain;
    delete grunt.config.data.watch.browserifyworker;
    grunt.registerTask('default', ['browserify:main', 'connect:server', 'watch']);
}
else {
    grunt.registerTask('default', ['connect:server', 'watch']);
}

grunt.registerTask('build', ['browserify:main', 'sass:main', 'autoprefixer:main', 'ejs:main']);

grunt.registerTask('log', function(){
    console.log(grunt.filerev.summary);
});

grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-connect');

grunt.loadNpmTasks('grunt-sass');
grunt.loadNpmTasks('grunt-autoprefixer');

grunt.loadNpmTasks('grunt-browserify');

grunt.loadNpmTasks('grunt-contrib-jade');
grunt.loadNpmTasks('grunt-ejs');

grunt.registerTask('release', ['copy:release', 'sass:release', 'autoprefixer:release', 'cssmin:release', 'browserify:release', 'uglify:release', 'ejs:release', 'compress:release', 'rsync:release']);

grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-cssmin');
grunt.loadNpmTasks('grunt-shell');
grunt.loadNpmTasks('grunt-contrib-compress');
grunt.loadNpmTasks('grunt-rsync');
grunt.loadTasks('tasks');

};
