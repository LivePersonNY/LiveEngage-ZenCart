<?php
$_liveengage_config_title = 'LivePerson LiveEngage Configuration';

$configuration = $db->Execute("SELECT configuration_group_id FROM " . TABLE_CONFIGURATION_GROUP . " WHERE configuration_group_title = '" . $_liveengage_config_title . "' ORDER BY configuration_group_id ASC;");
if ($configuration->RecordCount() > 0) {
	while (!$configuration->EOF) {
		$db->Execute("DELETE FROM " . TABLE_CONFIGURATION . " WHERE configuration_group_id = " . $configuration->fields['configuration_group_id'] . ";");
		$db->Execute("DELETE FROM " . TABLE_CONFIGURATION_GROUP . " WHERE configuration_group_id = " . $configuration->fields['configuration_group_id'] . ";");
		$configuration->MoveNext();
	}
}

$db->Execute("INSERT INTO " . TABLE_CONFIGURATION_GROUP . " (configuration_group_title, configuration_group_description, sort_order, visible) VALUES ('" . $_liveengage_config_title . "', 'Set LivePerson LiveEngage Options', '1', '1');");
$configuration_group_id = $db->Insert_ID();

$db->Execute("UPDATE " . TABLE_CONFIGURATION_GROUP . " SET sort_order = " . $configuration_group_id . " WHERE configuration_group_id = " . $configuration_group_id . ";");

$_liveengage_options = array(
	array(
		'title' => 'Version',
		'default' => '1.0.0',
		'key' => 'LIVEENGAGE_VERSION',
		'description' => 'LiveEngage Version',
		'use' => NULL,
		'set' => NULL, //@todo make sure to document that users should not change this setting
	),
	array(
		'title' => 'Widget Enabled',
		'default' => 'Disabled',
		'key' => 'LIVEENGAGE_ENABLED',
		'description' => 'Enables or disables the widget',
		'use' => NULL,
		'set' => 'zen_cfg_select_option(array("Enabled", "Disabled"), ',
	),
	array(
		'title' => 'LivePerson Account ID',
		'default' => '0',
		'key' => 'LIVEENGAGE_ACCOUNT',
		'description' => "Enter your LivePerson Account ID, if you don\'t have one, you can get one <a href=\"http://register.liveperson.com/zencart\">here</a>",
		'use' => NULL,
		'set' => NULL,
	),
);

foreach ($_liveengage_options as $key => $option) {
	$use = (isset($option['use'])) ? "'" . $option['use'] . "'" : "''";
	$set = (isset($option['set'])) ? "'" . $option['set'] . "'" : "''";
	$db->Execute("INSERT INTO " . TABLE_CONFIGURATION . "  (`configuration_id`, `configuration_title`, `configuration_key`, `configuration_value`, `configuration_description`, `configuration_group_id`, `sort_order`, `last_modified`, `date_added`, `use_function`, `set_function`) VALUES (NULL, '" . $option['title'] . "', '" . $option['key'] . "', '" . $option['default'] . "', '" . $option['description'] . "', $configuration_group_id, ($key+1), NOW(), NOW(), $use, $set);");
}


$zc150 = (PROJECT_VERSION_MAJOR > 1 || (PROJECT_VERSION_MAJOR == 1 && substr(PROJECT_VERSION_MINOR, 0, 3) >= 5));
if ($zc150)
{
// continue Zen Cart 1.5.0
// delete configuration menu

	$db->Execute("DELETE FROM admin_pages WHERE page_key = 'configLiveEngage' LIMIT 1;");
	// add configuration menu
	if (!zen_page_key_exists('configLiveEngage')) {
		zen_register_admin_page('configLiveEngage',
			'BOX_CONFIGURATION_LIVEENGAGE',
			'FILENAME_CONFIGURATION',
			'gID=' . $configuration_group_id,
			'configuration',
			'Y',
			$configuration_group_id);

		$messageStack->add('LivePerson LiveEngage Configuration menu enabled.', 'success');
	}
}
$messageStack->add('LivePerson LiveEngage was successfully installed', 'success');