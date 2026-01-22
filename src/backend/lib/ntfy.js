const getNtfy = async () => {
	const ntfy = await import('@jc21/ntfy-client');
	// You might need to return ntfy.default depending on the package export structure
	return ntfy;
};

class Ntfy {
	static build (token, server, topic) {
		return getNtfy()
			.then((ntfy) => {
				return new Ntfy(ntfy.publish, {token, server, topic});
			});
	}

	/**
	 * Constructor
	 *
	 * @param {String} config.token
	 * @param {String} config.server
	 * @param {String} config.topic
	 */
	constructor(publish, config) {
		this.config = config;
		this.config.topic = config.topic || 'juxtapose';
		this.publish = publish;
	}

	/**
	 * @param   {Object|String}   content
	 * @param   {String}          content.message
	 * @param   {String}          content.title
	 * @param   {String}          [content.icon_url]
	 * @param   {String}          [content.url]
	 * @param   {String}          [content.topic]
	 * @param   {Number}          [content.priority] between 1 and 5, default 3
	 * @returns {Promise}
	 */
	sendMessage(content) {
		return new Promise((resolve, reject) => {
			if (typeof content === "string") {
				content = {
					message: content,
				};
			}

			const msg = {
				server:        this.config.server,
				authorization: this.config.token,
				topic:         content.topic || this.config.topic,
				message:       content.message,
				title:         content.title || "Juxtapose",
				priority:      3,
			};

			if (typeof content.icon_url !== "undefined" && content.icon_url) {
				msg.iconURL = content.icon_url;
			}

			if (typeof content.priority !== "undefined" && content.priority >= 1 && content.priority <= 5) {
				msg.priority = content.priority;
			}

			if (typeof content.url !== "undefined" && content.url) {
				msg.clickURL = content.url;
			}

			if (typeof content.actions !== "undefined") {
				msg.actions = content.actions;
			}

			this.publish(msg).then(() => {
				resolve();
			})
			.catch((err) => {
				return reject(err);
			});
		});
	}
}

module.exports = Ntfy;
