module.exports = function(grunt) {

grunt.initConfig({
    watch: {
        options: {
        },
        grunt: {
            files: ['Gruntfile.js']
        },
        reload: {
            options: {
                livereload: true
            },
            files: ['*.css', '*.js', '*.html'],
            tasks: []
        },
        css: {
            files: ['*.scss'],
            tasks: ['sass']
        }
    },
    cssmin: {
        release: {
            files: {'dist/style.css':'dist/style.css'}
        }
    },
    compress: {
        release: {
            expand: true,
            cwd: 'public/',
            src: ['css/*.css', 'js/*.js', '**/*.html', 'feed.atom', 'sitemap.atom'],
            dest: 'public'
        }
    },
    sass: {
        style: {
            options: {
                sourceComments: 'map',
            },
            files: {'style.css': 'style.scss'}
        }
    },
    connect: {
        server: {
            options: {
                hostname: '*',
                base: '.',
                //keepalive: true,
                livereload: true,
                //debug: true,
                open: true
            }
        }
    },
    rsync: {
        options: {
            recursive: true
        },
        release: {
            options: {
                src: './dist/',
                dest: '/var/www/static/sandbox/2011/neonflames',
                host: '29a.ch',
                port: '22',
                dryRun: true
            }
        }
    }
});

grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-cssmin');
grunt.loadNpmTasks('grunt-contrib-connect');
grunt.loadNpmTasks('grunt-contrib-compress');
grunt.loadNpmTasks('grunt-rsync');
grunt.loadNpmTasks('grunt-sass');
//grunt.loadTasks('tasks');
grunt.registerTask('env', function(name) {
    grunt.config('environment', grunt.config('environments')[name]);
}); 
grunt.registerTask('default', ['build', 'connect:server', 'watch']);
grunt.registerTask('build', ['sass']);

};
