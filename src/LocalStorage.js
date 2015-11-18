(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], function() {
			var LocalStorage = factory();
			
			// In case the global is still needed
			root.LocalStorage = LocalStorage;

			return LocalStorage;
		});
	} else if (typeof exports !== 'undefined') {
		module.exports = factory();
	} else {
		root.LocalStorage = factory();
	}
})(this, function() {
	var constructorCheck = false;

	var allowedConstructors = [
		Object,
		Number,
		String,
		Array,
		Date,
		Boolean
	];

	var LocalStorageException = function(message, value) {
		this.name = 'LocalStorageException';
		this.message = message;
		this.value = value;
	}

	if (!this.localStorage) {
		this.localStorage = {
			_data       : {},
			setItem     : function(id, val) { return this._data[id] = String(val); },
			getItem     : function(id) { return this._data.hasOwnProperty(id) ? this._data[id] : undefined; },
			removeItem  : function(id) { return delete this._data[id]; },
			clear       : function() { return this._data = {}; }
		};

		console.error('LocalStorage is not supported by your browser. Avoiding hard crash by shimming (quick and dirty), thanks to https://gist.github.com/juliocesar/926500');
	}

	var LocalStorage = function(name, options) {
		if (!name) {
			throw new LocalStorageException('A LocalStorage instance must have a name');
		}

		options = (options && options.constructor === Object) ? options : {};

		var _name = name;
		var _validators = {};
		var _promise;

		var defaultOptions = {
			blockingValidation: false,
			usePromises: false
		};

		var _options = defaultOptions;

		Object.keys(defaultOptions).forEach(function(key) {
			if (options.hasOwnProperty(key)) {
				_options[key] = options[key];
			}
		});

		Object.defineProperty(this, 'options', {
			enumerable: true,
			get: function() {
				return _options;
			},
			set: function(value) {
				if (value.constructor !== Object) {
					throw new LocalStorageException("Cannot set the options property to anything other than an object.");
				}

				_options = value;
			}
		});

		Object.defineProperty(this, 'name', {
			enumerable: true,
			get: function() {
				return _name;
			}
		});

		Object.defineProperty(this, 'validators', {
			enumerable: true,
			get: function() {
				return _validators;
			},
			set: function(value) {
				if (value.constructor !== Object) {
					throw new LocalStorageException("Cannot set the validators property to anything other than an object. You shouldn't write this property directly anyways!");
				}

				_validators = value;
			}
		});

		Object.defineProperty(this, 'Promise', {
			enumerable: true,
			get: function() {
				if (!_promise && window.Promise) {
					_promise = window.Promise;
				}

				if (!_promise) {
					throw new LocalStorageException("Promises are not supported by your configuration, but you might try with a library or a polyfill!");
				}

				return _promise;
			},
			set: function(PromiseImplementation) {
				if (PromiseImplementation.constructor !== Function) {
					throw new LocalStorageException("Promise implementation must be a constructor.");
				}

				_promise = PromiseImplementation;
			}
		});
	}

	// Static methods
	LocalStorage.get = function(key) {
		var value = localStorage.getItem(key);
		if (value) {
			value = JSON.parse(value);
		}

		return value;
	}

	LocalStorage.set = function(key, value) {
		if (!value) {
			throw new LocalStorageException("No value has been passed");
		}

		if (constructorCheck === true && allowedConstructors.indexOf(value.constructor) === -1) {
			throw new LocalStorageException("Cannot serialize value", value);
		}

		localStorage.setItem(key, JSON.stringify(value));
	}

	LocalStorage.remove = function(key) {
		localStorage.removeItem(key);
	}

	LocalStorage.clear = function() {
		Object.keys(localStorage).forEach(function(key) {
			LocalStorage.remove(key);
		});
	}

	LocalStorage.allowConstructor = function(constructor) {
		allowedConstructors.push(constructor);
	}

	LocalStorage.toggleConstructorCheck = function(value) {
		constructorCheck = value;
	}

	// Instance methods
	LocalStorage.prototype.get = function(key) {
		return LocalStorage.get(this.name + ':' + key);
	}

	LocalStorage.prototype.set = function(key, value, validator) {
		var validatorCondition = (
			(validator && validator.constructor === Function && !validator(value)) || 
			(!validator && this.validators[key] && !this.validators[key](value))
		);

		if (this.options.usePromises === true) {
			var promise = new this.Promise(function(resolve, reject) {
				if (validatorCondition) {
					if (this.options.blockingValidation === true) {
						return reject(new LocalStorageException('Validation failed for key "' + key + '"', value));
					}

					return reject(false);
				}

				LocalStorage.set(this.name + ':' + key, value);

				return resolve(this);
			}.bind(this));

			return promise;
		}

		if (validatorCondition) {
			if (this.options.blockingValidation === true) {
				throw new LocalStorageException('Validation failed for key "' + key + '"', value);	
			}

			return false;
		}

		LocalStorage.set(this.name + ':' + key, value);

		return this;
	}

	LocalStorage.prototype.remove = function(key) {
		LocalStorage.remove(this.name + ':' + key);

		return this;
	}

	LocalStorage.prototype.all = function() {
		var collection = {};
		var regexp = new RegExp("^" + this.name + ":.+$");

		Object.keys(localStorage).forEach(function(k) {
			if (regexp.test(k)) {
				collection[k.substr(this.name.length + 1)] = LocalStorage.get(k);
			}
		}.bind(this));

		return collection;
	}

	LocalStorage.prototype.clear = function() {
		var regexp = new RegExp("^" + this.name + ":.+$");

		Object.keys(localStorage).forEach(function(k) {
			if (regexp.test(k)) {
				LocalStorage.remove(k);
			}
		}.bind(this));

		return this;
	}

	LocalStorage.prototype.setValidator = function(key, validator) {
		if (validator.constructor !== Function) {
			throw new LocalStorageException('A validator must be a function!');
		}

		this.validators[key] = validator;

		return this;
	}

	LocalStorage.prototype.clearValidator = function(key) {
		if (this.validators[key]) {
			delete this.validators[key];
		}

		return this;
	}

	LocalStorage.prototype.clearValidators = function() {
		this.validators = {};

		return this;
	}

	return LocalStorage;
});