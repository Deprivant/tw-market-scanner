module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        cssmin: {
            css: {
                src: 'src/css/style.css',
                dest: 'tmp/css.min.css',
            },
        },

        replace: {
            dist: {
                options: {
                    patterns: [
                        {
                            match: 'cssStyles',
                            replacement:
                                '<%= grunt.file.read("tmp/css.min.css") %>',
                        },
                        {
                            match: 'scriptVersion',
                            replacement: '<%= pkg.version %>',
                        },
                    ],
                },
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['src/script.js'],
                        dest: 'tmp/',
                    },
                ],
            },
        },

        removelogging: {
            dist: {
                src: 'tmp/script.js',
                dest: 'tmp/script-clean.js',

                options: {
                    // see below for options. this is optional.
                },
            },
        },

        uglify: {
            my_target: {
                options: {
                    compress: false,
                    mangle: false,
                    beautify: true,
                    banner:
                        '/**\n' +
                        ' * Name: <%= pkg.name %>\n' +
                        ' * Version: <%= pkg.version %>\n' +
                        ' * Desription: <%= pkg.description %>\n' +
                        ' * Author: <%= pkg.author %>\n' +
                        ' * Build: <%= grunt.template.today("dd-mm-yyyy") %>\n' +
                        ' * Homepage: <%= pkg.homepage %>\n' +
                        ' */\n',
                },
                files: {
                    'dist/<%= pkg.name %>.js': ['tmp/script.js'],
                },
            },
            my_advanced_target: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= pkg.version %>, Author: <%= pkg.author %> <%= grunt.template.today("yyyy/mm/dd") %>  <%= pkg.homepage %> */ \n',
                    mangle: true,
                },
                files: {
                    'dist/<%= pkg.name %>.min.js': ['tmp/script-clean.js'],
                },
            },
        },

        clean: { build: ['tmp/*', 'tmp'] },
    });
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-remove-logging');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', [
        'cssmin',
        'replace',
        'removelogging',
        'uglify',
        'clean',
    ]);
};
