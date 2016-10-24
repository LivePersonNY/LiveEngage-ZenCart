var path = require('path');
var util = require('util');
var when = require('when');

var config = require('./config/grunt-config.json');

module.exports = function(grunt) {
    var npmTasks = ['grunt-contrib-clean', 'grunt-contrib-compress', 'grunt-contrib-watch', 'grunt-contrib-copy',
        'grunt-prompt', 'grunt-github-api', 'grunt-zip', 'grunt-contrib-concat'];
    npmTasks.forEach(function(task){
       grunt.loadNpmTasks(task);
    });

    grunt.initConfig({
        watch: {
            zencart: {
                files: ['src/**'],
                tasks: ['copy:updatedocker']
            }
        },
        copy: {
            updatedocker: {
                files: [
                    {expand: true, cwd: 'src/YOUR_ADMIN', src: ['**'], dest: config.docker_root + '/' + config.admin_folder},
                    {expand: true, cwd: 'src/includes/templates/YOUR_TEMPLATE', src: ['**'], dest: config.docker_root + '/includes/templates/template_default'},
                    {expand: true, cwd: 'src/includes/modules/sideboxes', src: ['**'], dest: config.docker_root + '/includes/modules/sideboxes'}
                ]
            },
            install: {
                files: []
            }
        },
        compress: {
            build: {
                options: {
                    archive: 'build/liveengage_zencart.zip'
                },

                files: [
                    {expand: true, cwd: 'src/', src: ['**'], dest: '.' },
                    {expand: true, cwd: 'docs/', src: ['**', '!*.tpl'], dest: '.'}
                ]
            }
        },
        initconf: {
        },
        prompt: {
            init: {
                options: {
                    questions: [
                        {config: 'initconf.docker_root', type: 'input', message: 'Enter folder for docker volume', default: 'docker_root'},
                        {config: 'initconf.hostname', type: 'input', message: 'Enter hostname for your docker instance', default: 'localhost'},
                        {config: 'initconf.admin_folder', type: 'input', message: 'Enter an admin folder', default: 'dev_admin'},
                        {config: 'initconf.release_to_install', type: 'list', message: 'Select the release to install', choices: release_choices},
                        {config: 'initconf.admin_user', type: 'input', message: 'Enter admin username', default: 'admin'},
                        {config: 'initconf.admin_pass', type: 'input', message: 'Enter admin password', default: 'admin'}

                    ]
                }
            }
        },
        github: {
            getReleases: {
                src: '/repos/zencart/zencart/releases',
                dest: 'tmp/releases.json'
            },
            dlRelease: {
                options: {
                    task: {
                        type: 'file'
                    }
                },
                src: '/repos/zencart/zencart/zipball/v1.5.5a'
            }
        },
        unzip: {
            'tmp/': 'tmp/zencart.zip'
        },
        clean: {
            uninstall: {
                files: [],
                options: {
                    'no-write': true
                }
            },
            tmp: {
                files: [{src: 'tmp/**'}],
                options: {
                    'no-write': true
                }
            }
        },
        concat: {
            mysql: {}
        }
    });

    grunt.registerTask('uninstall-mysql', 'Clear plugin config from the docker db', function () {
        var done = this.async();
        var sql = grunt.file.read('src/uninstall.sql');
        //grunt.verbose.ok("sql: ", sql);
        var dir = __dirname.split("\\").splice(-1,1)[0].toLowerCase(); //get the docker-compose base name
        var opts = {
            cmd: 'docker',
            grunt: false,
            args: ['exec', '-i', dir + '_db_1', 'mysql', '--user=root', '--password=root', '--database=zencart']
        };
        var spawn = grunt.util.spawn(opts, function(error, result, code){
            //console.log({error: error, result: result, code: code});
            if (error || code !== 0) grunt.log.error(error);
            grunt.verbose.ok("Docker/mysql exit code:", code);
            done();
        });
        spawn.stdin.write(sql);
        spawn.stdin.end();
    });

    grunt.registerTask('uninstall-files', 'Remove plugin files from the docker working directory', function() {
        var cleanme = return_working_paths(true);
        //change the config for our clean task and then run it
        grunt.config('clean.uninstall.files', {src: cleanme});
        grunt.task.run(['clean:uninstall']);

    });

    grunt.task.registerTask('uninstall', 'Remove db entries and files from docker root', ['uninstall-files', 'uninstall-mysql']);
    grunt.task.registerTask('install-plugin', 'Copy plugin files to docker root', ['copy:updatedocker']);

    grunt.registerTask('build', 'Build the download package', function() {
        //populate readme with current file paths
        var doc = grunt.file.read('docs/README.tpl');
        var paths = return_working_paths(false);
        console.log(paths);
        doc = grunt.template.process(doc, {data: {FILES: paths}});
        grunt.file.write('docs/README.TXT', doc);
        //compress src and docs into zip
        grunt.task.run(['compress:build']);
        grunt.log.ok("ZenCart package built");
    });

    grunt.registerTask('init', 'Setup docker environment and install test database', [
        'clean:tmp',
        'prompt:init',
        'init-download',
        'uninstall-files',
        'unzip',
        'init-install-files',
        'init-map-config',
         'init-install-sql',
        'init-password',
        'init-final'
    ]);

    grunt.registerTask('init-download', 'download zencart', function() {
        grunt.task.requires('prompt:init');
        grunt.config.requires('initconf.docker_root','initconf.hostname', 'initconf.admin_folder', 'initconf.release_to_install');
        var initconf = grunt.config.get('initconf');
        var done = this.async();

        download_github_release(initconf.release_to_install, 'tmp/zencart.zip', done);

    });
    grunt.registerTask('init-install-files', 'copy zencart files', function() {
        grunt.task.requires('unzip'); //@todo uncomment
        var opts = grunt.config.get('initconf');
        opts.docker_root = "test";
        if (grunt.file.exists('tmp/zencart.zip')) {
            var tmp_dir = grunt.file.expand('tmp/*');
            var found = false;
            tmp_dir.forEach(function(path, index){
                if (grunt.file.isDir(path) && !found) {
                    if (grunt.file.exists(path + "/zc_install/index.php")) {
                        //found the extracted fip files, now time to move them to the docker_root
                        grunt.config('copy.install.files', [{expand: true, cwd: path, src: ['**'], dest: opts.docker_root}]);
                        found = true;
                    }
                }
            });
            if (found) {
                grunt.task.run('copy:install');
            } else {
                grunt.fail.fatal("did not find zencart root");
            }
        } else {
            grunt.fail.fatal("missing release archive");
        }
    });
    grunt.registerTask('init-map-config', 'insert vars and copy config files', function() {
        grunt.task.requires('init-install-files');
        var opts = grunt.config.get('initconf');
        opts.admin_folder = "testing";
        opts.hostname = "local.dev";
        opts.docker_root = "test";
        var files = [
            {src: 'config/configure.php.tpl', dest: opts.docker_root + '/' + opts.admin_folder + '/includes/configure.php', admin: true},
            {src: 'config/configure.php.tpl', dest: opts.docker_root + '/includes/configure.php'},
            {src: 'config/grunt-config.json.tpl', dest: 'config/grunt-config.json'}
        ];
        files.forEach(function(file, i){
            var data = opts;
            if (file.admin) data.admin = true;
            var tpl = grunt.file.read(file.src);
            var save_file = grunt.template.process(tpl, {data: data});
            grunt.file.write(file.dest, save_file);
            grunt.verbose.ok("Saved config with vars at "+file.dest);
        });
    });
    grunt.registerTask('init-concat-sql', 'concat all sql files into one big one', function(){
        //grunt.task.requires('init-map-config');
        var dir = __dirname.split("\\").splice(-1,1)[0].toLowerCase(); //get the docker-compose base name
        var opts = grunt.config.get('initconf');
        opts.docker_root = "test";
        var files = [
            {src: opts.docker_root + '/' + 'zc_install/sql/install/mysql_zencart.sql'},
            {src: opts.docker_root + '/' + 'zc_install/sql/install/mysql_utf8.sql'},
            /*{src: opts.docker_root + '/' + 'zc_install/sql/updates/!**'},*/
            {src: opts.docker_root + '/' + 'zc_install/sql/demo/mysql_demo.sql'}
        ];
        var paths = [];
        files.forEach(function (file) {
            var these_paths = grunt.file.expand(file.src);
            Array.prototype.push.apply(paths, these_paths);

        });
        grunt.config('concat.mysql', {src: paths, dest: 'tmp/all_install.sql'});
        console.log(grunt.config.get('concat.mysql'));
        grunt.task.run(['concat:mysql']);
    });
    grunt.registerTask('init-install-sql', '', function() {
        //grunt.task.requires('init-concat-sql');
        var done = this.async();
        var docker_composer_prefix = __dirname.split("\\").splice(-1,1)[0].toLowerCase(); //get the docker-compose base name

        when.promise(function (resolve, reject) {
            var opts = {
                cmd: 'docker',
                grunt: false,
                args: ['cp', 'tmp/all_install.sql', docker_composer_prefix + '_db_1:/tmp/all_install.sql']
            };
            var spawn = grunt.util.spawn(opts, function (error, result, code) {
                //console.log({error: error, result: result, code: code});
                if (error || code !== 0) {
                    grunt.verbose.error("sql: "+path+" error: "+error);
                    reject(error);
                }
                grunt.verbose.ok(path + " Docker/mysql exit code:", code);
                resolve();
            });
            resolve();
        }).delay(100).then(function (){
            var opts = {
                cmd: 'docker',
                grunt: false,
                args: ['exec', '-i', docker_composer_prefix + '_db_1', 'mysql', '--user=root', '--password=root', /*'--database=zencart',*/ "sh -c 'zencart < /tmp/all_install.sql'"]
            };
            var spawn = grunt.util.spawn(opts, function (error, result, code) {
                //console.log({error: error, result: result, code: code});
                if (error || code !== 0) {
                    grunt.verbose.error("sql: "+path+" error: "+error);
                    grunt.fail.fatal(error);
                }
                grunt.verbose.ok(path + " Docker/mysql exit code:", code);
                done();
            });
        });


    });
    grunt.registerTask('init-password', 'get an encrypted password', function () {
        grunt.config.require('initconf.admin_pass');
        var initconf = grunt.config.get('initconf');
        var docker_composer_prefix = __dirname.split("\\").splice(-1,1)[0].toLowerCase(); //get the docker-compose base name
        var done = this.async();
        var php = "define('DIR_FS_ROOT', '/app/'); " +
            "require '/app/includes/classes/class.base.php'; " +
            "require 'zc_install/includes/functions/password_funcs.php'; " +
            "echo zen_encrypt_password('"+initconf.admin_pass+"');";
        //docker exec -it zencart_phpfpm_1 php -r
        when.promise(function (resolve, reject) {
            var opts = {
                cmd: 'docker',
                grunt: false,
                args: ['exec', '-i', docker_composer_prefix + '_phpfpm_1', 'php', '-r', php]
            };
            var spawn = grunt.util.spawn(opts, function (error, result, code) {
                console.log({error: error, result: result, code: code});
                if (error || code !== 0) {
                    grunt.verbose.error("sql: "+path+" error: "+error);
                    reject(error);
                }
                grunt.verbose.ok(path + " Docker/mysql exit code:", code);
                resolve(result.stdout);
            });
            /*spawn.stdin.write('');
            spawn.stdin.end();*/
        }).then(function (password){
            var opts = {
                cmd: 'docker',
                grunt: false,
                args: ['exec', '-i', docker_composer_prefix + '_phpfpm_1', 'php', '-r', php]
            };
            var sql = "INSERT INTO admin (admin_name, admin_email, admin_pass, admin_profile, pwd_last_change_date) " +
            "VALUES ("+initconf.admin_user+", 'admin@localhost', '"+password+"', 1, NOW());";
            var spawn = grunt.util.spawn(opts, function (error, result, code) {
                console.log({error: error, result: result, code: code});
                if (error || code !== 0) {
                    grunt.verbose.error("sql: "+path+" error: "+error);
                    reject(error);
                }
                grunt.verbose.ok(path + " Docker/mysql exit code:", code);
                done();
            });
        });
    });
    grunt.registerTask('init-final', 'final status info', function () {
        var initconf = grunt.config.get('initconf');
        grunt.log.ok("Zencart is now setup and configured");
        grunt.log.ok("You can use the 'grunt watch' task to automatically copy changes from src to your docker_root");
        if (initconf.docker_root != "docker_root") grunt.log.ok("You've selected a different location for your docker_root, " +
            "please make sure that you update the docker-compose file");
        grunt.log.ok("You can access your new zencart dev site at: http://"+initconf.hostname);
        grunt.log.ok("")
    });

    /**
     *
     * @param replace(bool)
     * @returns {Array}
     */
    function return_working_paths(replace) {
        var copyfiles = grunt.config.get('copy.updatedocker.files');
        var paths = [];
        // console.log(copyfiles);
        copyfiles.forEach(function(el, i, context) {
            //expand the given glob
            var expand = grunt.file.expand(el.cwd + '/' + el.src);
            expand.forEach(function(path){
                var file = '';
                if (replace) {
                     file = path.replace(el.cwd, el.dest);
                    //console.log(file);
                    if (grunt.file.isFile(file)) paths.push(file); //we're just removing files, this could leave stay empty folders
                } else {
                    file = path;
                    //console.log({file: file, rpl: file.replace('src/', '')});
                    if (grunt.file.isFile(file)) paths.push(file.replace('src/', '')); //we're just removing files, this could leave stay empty folders
                }
            });
        });
        return paths;
    }

    function release_choices() {
        grunt.task.run(['github:getReleases']);
        if (!grunt.file.isFile('tmp/releases.json')) grunt.fail("Couldn't get latest releases from github");
        var releases = JSON.parse(grunt.file.read('tmp/releases.json'))[0];
        var choices = [];
        for (var index = 0; index < releases.length; index++) {
            choices.push({
                name: releases[index].tag_name,
                checked: (index == 0),
                value: releases[index].zipball_url
            });
        }
        return choices;
    }

    function download_github_release(src, dest, done) {
        var request = require('request');
        var fs = require('fs');

        request({
            uri: src,
            headers: {'User-Agent': 'Grunt script for LivePersonNY/LiveEngage-ZenCart'},
            encoding: null
        }, function (error, response, body) {
            if (error) done(error);
            var destdir = path.dirname(dest);
            grunt.file.mkdir(destdir);
            var ok = grunt.file.write(dest, body);
            done(ok);

        });
    }

};

