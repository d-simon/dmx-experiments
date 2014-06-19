'use strict';

var time = require('time-grunt'),
    path = require('path'),
    folderMount = function folderMount(connect, point) {
        return connect.static(path.resolve(point));
    };

module.exports = function(grunt) {

    // Show elapsed time at the end
    time(grunt);

    // Project configuration.
    grunt.initConfig({
        connect: {
            server: {
                options: {
                    port: 9001,
                    base: 'html',
                    middleware: function(connect) {
                        return [
                            require('connect-livereload')(),
                            folderMount(connect, 'html/')
                        ];
                    }
                }
            },
            build: {
                options: {
                    port: 9002,
                    middleware: function(connect) {
                        return [
                            require('connect-livereload')(),
                            folderMount(connect, 'dist/')
                        ];
                    }
                }
            }
        },
        watch: {
            main: {
                options: {
                    livereload: true
                },
                files: ['html/index.html', 'html/scss/**', 'html/media/**', 'html/js/**'],
                tasks: ['jshint', 'sass:dev']
            },
            build: {
                options: {
                    livereload: true
                },
                files: ['html/index.html', 'html/scss/**', 'html/media/**', 'html/js/**'],
                tasks: ['jshint', 'build']
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            files: ['js/**/*.js']
        },
        clean: {
            before: {
                src: ['html/css', 'dist', 'temp']
            },
            after: {
                src: ['temp']
            }
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'html/',
                    src: [
                        'index.html',
                        '.htaccess',
                        'media/**',
                        'font/**'
                    ],
                    dest: 'dist/'
                }]
            },
            ionicons: {
                files: [{
                    expand: true,
                    cwd: 'html/',
                    src: [
                        'components/ionicons/fonts/**',
                        'components/ionicons/css/**'
                    ],
                    dest: 'dist/'
                }]

            }
        },
        dom_munger: {
            readscripts: {
                options: {
                    read: {
                        selector: 'script[data-build!="exclude"]',
                        attribute: 'src',
                        writeto: 'mainjs',
                        isPath: true
                    }
                },
                src: 'html/index.html'
            },
            readcss: {
                options: {
                    read: {
                        selector: 'link[rel="stylesheet"]',
                        attribute: 'href',
                        writeto: 'maincss',
                        isPath: true
                    }
                },
                src: 'html/index.html'
            },
            removescripts: {
                options: {
                    remove: 'script[data-remove!="exclude"]',
                    append: {
                        selector: 'head',
                        html: '<script src="js/main.full.min.js"></script>'
                    }
                },
                src: 'dist/index.html'
            },
            removecss: {
                options: {
                    remove: 'link[data-remove!="exclude"]',
                    append: {
                        selector: 'head',
                        html: '<link rel="stylesheet" href="css/main.full.min.css">'
                    }
                },
                src: 'dist/index.html'
            }
        },
        sass: {
            build: {
                options: {
                    loadPath: require('node-neat').includePaths
                },
                files: [{
                    expand: true,
                    cwd: 'html/scss/',
                    src: ['*.scss'],
                    dest: 'html/css',
                    ext: '.css'
                }]
            },
            dev: {
                options: {
                    loadPath: require('node-neat').includePaths
                },
                files: [{
                    expand: true,
                    cwd: 'html/scss/',
                    src: ['*.scss'],
                    dest: 'html/css',
                    ext: '.css'
                }]
            }
        },
        cssmin: {
            main: {
                src: ['temp/main.css', '<%= dom_munger.data.maincss %>'],
                dest: 'dist/css/main.full.min.css'
            }
        },
        concat: {
            main: {
                src: ['<%= dom_munger.data.mainjs %>'],
                dest: 'temp/main.full.js'
            }
        },
        uglify: {
            main: {
                src: 'temp/main.full.js',
                dest: 'dist/js/main.full.min.js'
            }
        },
        htmlmin: {
            main: {
                options: {
                    removeComments: false,
                    collapseWhitespace: true
                },
                files: {
                    'dist/index.html': 'dist/index.html'
                }
            }
        },
        imagemin: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**/{*.png,*.jpg}'],
                    dest: 'dist/'
                }]
            }
        },
        'gh-pages': {
            options: {
                base: 'dist',
                message: 'Auto-generated commit'
            },
            src: ['**']
        },
        prompt: {
            'gh-pages-confirm': {
                options: {
                    questions: [{
                        config: 'gh-pages-confirm',
                        type: 'confirm',
                        message: 'Do you really want to commit to gh-pages branch?',
                        default: false
                    }],
                    then: function (answers) {
                        if (answers['gh-pages-confirm'] !== true) {
                            grunt.fail.warn('Canceled');
                        }
                    }
                }
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('build', [
        'jshint',
        'clean:before',
        'sass:build',
        'dom_munger:readcss',
        'dom_munger:readscripts',
        'cssmin',
        'concat',
        'uglify',
        'copy',
        'dom_munger:removecss',
        'dom_munger:removescripts',
        'htmlmin',
        'imagemin',
        'clean:after'
    ]);

    grunt.registerTask('server', ['server:local']);
    grunt.registerTask('server:local', ['jshint', 'sass:dev', 'connect:server', 'watch:main']);
    grunt.registerTask('server:build', ['build', 'connect:build', 'watch:build']);

    grunt.registerTask('default', ['build']);

    grunt.registerTask('publish', ['prompt:gh-pages-confirm', 'build', 'gh-pages']);

};
