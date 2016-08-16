<?php
if (!defined('IS_ADMIN_FLAG')) {
  die('Illegal Access');
} 

$autoLoadConfig[9999][] = array(
  'autoType' => 'init_script',
  'loadFile' => 'init_liveengage_config.php'
);