<?php

	require('keys.php');

	$url = $_GET['url'];

	if (strpos($url, 'api.themoviedb.org') !== FALSE) {
	    header('Content-Type: application/json');
		if (strpos($url, '?') !== FALSE) {
			$url .= '&';
		} else {
			$url .= '?';
		}

		$url .= 'api_key=' . $tmdbKey;
	} else {
	    header('Content-Type: text/xml');
	}

	if(strpos($url, 'https://') === 0 || strpos($url, 'http://') === 0) {
		$data = file_get_contents(strtr($url, ' ', '+'));
		echo $data;
	}

?>
