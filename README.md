#LocalStorage 
A wrapper library for HTML5's native localStorage, with some utility functions, validation and namespacing. 

##Installation
You can install the library by using `bower install localstoragejs` or you can checkout the repo directly. Depending on your configuration, either incude the file in the `src` directory or the one in the `dist` directory.

The module exposes both a global `LocalStorage` variable and, if you're using it, a `requirejs` module. 

##Usage
You can use the module directly from the `LocalStorage` global variable through its static methods, that allow for a straightforward wrapping of the localStorage functions. The only difference is that whatever you're saving in the dictionary is automatically stringified/parsed as JSON. 

````javascript
LocalStorage.set('myValue', 15); // Saves the value 15 as `myValue`.
LocalStorage.get('myValue'); // Retrieves whatever is saved in `myValue`.
LocalStorage.remove('myValue'); // Clears the `myValue` key
LocalStorage.clear(); // Removes everything from local storage.
LocalStorage.allowConstructor(constructor); // Allows the serialization of the specified constructor.
````

If you want more flexibility, you can create an instance of the LocalStorage object. This will namespace all the keys to the name of the instance, and will also allow you to use validators.

###Namespacing
Namespacing allows you to 'group' keys together by using a common prefix, which is based on the string you pass to the LocalStorage constructor.

````javascript
// Creates an instance of the LocalStorage object. 
// All the keys will be namespaced within "DB"
var db = new LocalStorage('DB'); 

// Saves the array [1,2,3] in the 'myValue' key for the "DB" namespace. 
// This means that the real key will be "DB:myValue".
db.set('myValue', [1,2,3]); 

// Retrieves [1,2,3] from the 'myValue' key within the "DB" namespace. 
// This means that you're retrieving whatever is saved within the "DB:myValue" key.
db.get('myValue'); 

// Removes the 'myValue' key from the DB namespace. 
// You're actually removing the "DB:myValue" key.
db.remove('myValue'); 

// Retrieves all the keys for the current object's namespace. 
// In this instance, you're retrieving all the keys that begin with "DB:"
db.all(); 

// Clears all the keys associated to the object's namespace. 
// Here, you'll be removing all the keys that begin with "DB:"
db.clear(); 
````

###Validation
Sometimes you might want to validate a value before saving it. Validators serve exactly that purpose and come in two flavors: one-shot and permanent.

When you create an instance of the `LocalStorage` object, you have the option to pass a second parameter with some options. Right now, the only option available is the `blockingValidation` option which, if set to true, makes the `set` call throw a `LocalStorageException` when failing validation instead of simply returning `false`.

####One-shot validators
A one-shot validator is evaluated within the scope of a single `set` call and is not saved within your `LocalStorage` object instance. 

````javascript
var db = new LocalStorage('DB');

// This will fail since the passed value does not pass the validation test.
db.set('username', 'fred', function(value) {
	return value.length >= 8;
});
````

####Permanents validators
A permanent validator is associated with a key and will be called anytime you attempt to save a value for that key. A permanent validator has lower priority than a one-shot validator, so you can always override it by passing a one-shot validator (or `true`) to a `set` call. 

````javascript
// By passing the 'blockingValidation' option, we make 
// the 'set' call throw an exception when validation fails.
var db = new LocalStorage('DB', {blockingValidation: true});

db.setValidator('username', function(value) {
	return value.length >= 8;
});

// This will fail
db.set('username', 'fred');

// This will pass
db.set('username', 'fred1234');

// This too wil pass
db.set('username', 'fred', function(value) { return value === 'fred'; });

// If you just want to skip validation for a single call, go ahead:
db.set('username', 'brad', true);
````

If you want to clear a permanent validator, or you want to clear all of them, you can do so by calling either the `clearValidator` or the `clearValidators` functions:

````javascript
// This will clear the permanent validator associated with the 'username' key
db.clearValidator('username');

// This will clear all the permanent validators on this instance of LocalStorage
db.clearValidators();
````

###Chaining
The following instance methods are chainable:
- `set` (when validation passes)
- `remove`
- `all`
- `setValidator`
- `clearValidator`
- `clearValidators`

That's pretty much it (for now)!

##A note on compatibility
I'm assuming this library will be used in projects made for modern browsers. I haven't put any effort in testing compatibility other than to check if the `localStorage` variable is present on the global scope. If you feel that this is not sufficient, please send a PR and I will consider it!

##Promises?
Even though all this stuff is synchronous, I'm toying with the idea of using promises instead of/alongside return values. For example, there could be an option like `usePromises` that makes each method return a promise instead of the result of the operation or the object itself (for chainable methods). This would remove the ambiguity of the return value for the `set` method, and would allow - with some tweaking - the use of asynchronous validators. For this purpose I would need to make this library dependent on a library such as Q or BlueBird. Thoughts?

##Contributing
If you find bugs or things you don't like, please send a PR. Remember to build the minified version of library using `grunt` and update the README if required.

##License
MIT