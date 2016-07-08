//globals

module.exports = {
	onlyIntsRegex		: /^[0-9]+$/,
	phoneRegex   		: /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/,
	usernameRegex		: /^[a-zA-Z0-9]+$/,
	passwordRegex		: /^[a-zA-Z0-9:.?!@#$%^&*\-=_+\'\";<>,\/]+$/,
	individualNameRegex : /^[\w\d]+$/i,
	commentRegex		: /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i,
	dishNameRegex		: /^[\w\d -()0-9]+$/,
	addressRegex		: /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i,
	emailRegex			: /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
	priceRegex			: /^\$?[0-9]+\.?[0-9]{0,}$/,
	latLngRegex         : /^-?[0-9]{1,3}\.?[0-9]{0,}$/

};
// global.onlyIntsRegex    = /^[0-9]+$/;
// global.phoneRegex       = /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/;
// global.usernameRegex    = /^[a-zA-Z0-9]+$/;
// global.passwordRegex    = /^[a-zA-Z0-9:.?!@#$%^&*\-=_+\'\";<>,\/]+$/;
// global.individualNameRegex = /^[\w\d]+$/i;
// global.commentRegex     = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
// global.mealRegex        = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
// global.addressRegex        = /^[\w\d.,:;"'-=_+!@#$%^&*0-9 ]+$/i;
// global.latLngRegex      = /^-?[0-9]{1,3}\.?[0-9]{0,}$/;
// global.priceRegex       = /^\$?[0-9]+\.?[0-9]{0,}$/;
// global.emailRegex       = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

