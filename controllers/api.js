exports.install = function() {

	// Enable CORS for API
	CORS('/api/*', ['get', 'post', 'put', 'delete'], true);

	// Operations
	ROUTE('/api/subscribers/',              ['*Subscriber --> save', 'post']);
	ROUTE('/api/contact/',                  ['*Contact --> save', 'post']);
	ROUTE('/api/unsubscribe/', unsubscribe, ['*Subscriber']);

	// Newsletter view
	FILE('/newsletter.gif', file_newsletterviewstats);
};

function file_newsletterviewstats(req, res) {
	NOSQL('newsletters').counter.hit('all');
	req.query.id && NOSQL('newsletters').counter.hit(req.query.id);
	res.binary('R0lGODdhAQABAIAAAAAAAAAAACH5BAEAAAEALAAAAAABAAEAAAICTAEAOw==', 'image/gif', 'base64');
}

function unsubscribe() {
	var self = this;
	self.$workflow('unsubscribe', () => self.plain(TRANSLATOR(self.language, '@(You have been successfully unsubscribed.\nThank you)')));
}