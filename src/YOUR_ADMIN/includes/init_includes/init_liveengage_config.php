<?php
  if (!defined('IS_ADMIN_FLAG')) {
    die('Illegal Access');
  }
  // add upgrade script
  $liveengage_version = (defined('LIVEENGAGE_VERSION')) ? LIVEENGAGE_VERSION : 'new';
  $current_version = '1.0.0';
  while ($liveengage_version_version != $current_version) {
    switch($liveengage_version) {
      case 'new':
        // perform upgrade
        if (file_exists(DIR_WS_INCLUDES . 'installers/liveengage/new_install.php')) {
          include_once(DIR_WS_INCLUDES . 'installers/liveengage/new_install.php');
          $liveengage_version = '1.0.0';
          break;
        } else {
          break 2;
        }
      default:
        $liveengage_version = $current_version;
        // break all the loops
        break 2;
    }
  }

//  print "<pre>".print_r($_REQUEST, true)."</pre>";die();
	if ($_REQUEST['action'] == 'save' && $_REQUEST['layout_box_name'] == 'liveengage.php') {
		global $messageStack;
		$messageStack->add_session('Please change the LiveEngage box settings on the configuration page', 'error');
	}
  //hack to force enable our layout box depending on the status in the config options
	if (defined('LIVEENGAGE_ENABLED') && LIVEENGAGE_ENABLED == "Enabled") {
		_liveengage_sidebox_force_enable();
	} else {
		_liveengage_sidebox_force_disable();
	}

	function _liveengage_sidebox_force_enable() {
		$result = _liveengage_get_box_status();
		if ($result['status'] < 2) {
			_liveenage_update_box($result['id'], 1);
		}
	}
	function _liveengage_sidebox_force_disable() {
		$result = _liveengage_get_box_status();
		if ($result['status'] != 0) {
			_liveenage_update_box($result['id'], 0);
		}
	}
	function _liveengage_get_box_status() {
		global $db;
		global $template_dir;
		$result = $db->Execute( "select * from " . TABLE_LAYOUT_BOXES . " where layout_template ='" . $template_dir . "' and layout_box_name='liveengage.php'" );
		$return = array(
			'id' => $result->fields['layout_id'],
			'status' => ($result->fields['layout_box_status'] + $result->fields['layout_box_status_single']));
		return $return;
	}
	function _liveenage_update_box($id, $value) {
		global $db;
		$return = $db->Execute("update " . TABLE_LAYOUT_BOXES . " set layout_box_status = '" . zen_db_input($value) . "',  layout_box_status_single = '" . zen_db_input($value) . "' where layout_id = '" . zen_db_input($id) . "'");
		return $return;
	}

	//handy debug function
/*
global $messageStack; $messageStack->add("get_status:<br><pre>".print_r(get_defined_vars(), true)."</pre>");
*/