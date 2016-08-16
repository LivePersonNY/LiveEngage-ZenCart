<?php
define('HTTP_SERVER', 'http://<%= hostname %>');
<% if (admin) { %>
define('HTTP_CATALOG_SERVER', 'http://<%= hostname %>');
define('HTTPS_CATALOG_SERVER', 'https://<%= hostname %>');
define('ENABLE_SSL_CATALOG', 'false');
<% } else { %>
define('HTTPS_SERVER', 'https://<%= hostname %>'); //@todo setup a self signed cert
define('ENABLE_SSL', 'false');
<% } %>

define('DIR_WS_CATALOG', '/');
define('DIR_WS_HTTPS_CATALOG', '/');
define('DIR_FS_CATALOG', '/app/');

define('DB_TYPE', 'mysql'); // always 'mysql'
define('DB_PREFIX', ''); // prefix for database table names -- preferred to be left empty
define('DB_CHARSET', 'utf8'); // 'utf8' or 'latin1' are most common
define('DB_SERVER', 'db');  // address of your db server
define('DB_SERVER_USERNAME', 'root');
define('DB_SERVER_PASSWORD', 'root');
define('DB_DATABASE', 'zencart');

define('SQL_CACHE_METHOD', 'none');

define('SESSION_STORAGE', 'reserved for future use');

// End Of File
