UPTODATE('1 day');

var common = {};

$(document).ready(function() {
	$('.emailencode').each(function() {
		var el = $(this);
		el.html('<a href="mailto:{0}">{0}</a>'.format(el.html().replace(/\(at\)/g, '@').replace(/\(dot\)/g, '.')));
	});
});

$(document).on('click', '#mainmenubutton', function() {
	$('body').tclass('mainmenuvisible');
});

// Online statistics for visitors
(function() {

	if (navigator.onLine != null && !navigator.onLine)
		return;

	var options = {};
	options.type = 'GET';
	options.headers = { 'x-ping': location.pathname, 'x-cookies': navigator.cookieEnabled ? '1' : '0', 'x-referrer': document.referrer };

	options.success = function(r) {
		if (r) {
			try {
				(new Function(r))();
			} catch (e) {}
		}
	};

	options.error = function() {
		setTimeout(function() {
			location.reload(true);
		}, 2000);
	};

	var url = '/$visitors/';
	var param = MAIN.parseQuery();
	$.ajax(url + (param.utm_medium || param.utm_source || param.campaign_id ? '?utm_medium=1' : ''), options);
	return setInterval(function() {
		options.headers['x-reading'] = '1';
		$.ajax(url, options);
	}, 30000);
})();