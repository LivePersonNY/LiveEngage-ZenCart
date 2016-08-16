Use `npm install --only="dev"` to install grunt modules. Grunt must be installed globally.

When creating a new install, grunt will build the grunt-config.json file for you. Just run:
```
docker-compose up -d
grunt init
```
 This will perform the following steps:
 * Start docker instances for mariadb, nginx, phpfpm, and phpmyadmin
 * Clean the temp directory
 * Prompt you for config variables
 * Download and unzip the specified version of Zencart to your docker root folder
 * Create config files for Zencart in the docker root
 * Install Zencart sql to mariadb
 * Create the admin password for your Zencart
It's recommended to reload your docker instances with `docker-composer restart` follow the init command.

Other grunt commands:
* `grunt watch` - automatically copy changes from src to your docker root
* `grunt build` - update the zip file in the build folder with the /src files and docs
