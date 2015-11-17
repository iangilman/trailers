/*globals zot */
/// zot.subscribable 0.01
/// Copyright 2012, Ian Gilman
/// http://iangilman.com
/// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

(function(){

  // ==========
  if (!("zot" in window))
    throw new Error("Requires zot!");
    
  // ==========
  zot.subscribable = {
    // ----------
    subscribe: function(key, typeOrCallback, callback) {
      zot.assert(key, "key must exist");
      
      var type = "*"; 
      if (callback !== undefined) {
        type = typeOrCallback;
        zot.assert(type && typeof type == "string", "type must be a non-empty string");
      } else {
        callback = typeOrCallback;
      }

      zot.assert(typeof callback == "function", "callback must be a function");
      
      if (!this._subscriptions)
        this._subscriptions = {};
        
      if (!this._subscriptions[type])
        this._subscriptions[type] = [];
        
      for (var a = 0; a < this._subscriptions[type].length; a++) {
        var sub = this._subscriptions[type][a];
        if (sub.key == key) {
          sub.callback = callback;
          return;
        }
      }
      
      this._subscriptions[type].push({
        key: key, 
        callback: callback
      });
    }, 
    
    // ----------
    unsubscribe: function(key, type) {
      zot.assert(key, "key must exist");
      
      if (!this._subscriptions)
        return;

      if (type === undefined) {
        for(var t in this._subscriptions)
          this._unsubscribeByType(key, t);
      } else {
        zot.assert(type && typeof type == "string", "type must be a non-empty string");
        this._unsubscribeByType(type);
      }
    }, 
    
    // ----------
    set: function(config) {
      var changes = {};
      for (var k in config) {
        if (this.__setOne(k, config[k], {silent: true})) {
          changes[k] = config[k];
        }
      }

      for (k in changes) {
        this._publish("change:" + k, {value: changes[k]});
      }
    },

    // ----------
    getAll: function() {
      var result = {};
      if (this.__observables) {
        for (var k in this.__observables) {
          result[k] = this.__observables[k].value;
        }
      }

      return result;
    },

    // ----------
    _unsubscribeByType: function(key, type) {
      if (!this._subscriptions || !this._subscriptions[type])
        return;

      for (var a = 0; a < this._subscriptions[type].length; a++) {
        var sub = this._subscriptions[type][a];
        if (sub.key == key) {
          this._subscriptions[type].splice(a, 1);
          return;
        }
      }
    }, 
    
    // ----------
    _publish: function(type, data) {
      data = data || {};
      data.type = type;
      data.from = this;
      this._publishByType(type, data);
      this._publishByType("*", data);
    }, 
    
    // ----------
    _publishByType: function(type, data) {      
      if (!this._subscriptions || !this._subscriptions[type])
        return;
      
      for (var a = 0; a < this._subscriptions[type].length; a++) {
        var sub = this._subscriptions[type][a];
        sub.callback(data);
      }
    },

    // ----------
    __setOne: function(name, value, config) {
      config = config || {};
      zot.assert(this.__observables, '[zot.subscribable] target must have observables');
      var observable = this.__observables[name];
      zot.assert(observable, '[zot.subscribable] bad observable: ' + name);

      if (value == observable.value)
        return false;
        
      observable.value = value;

      if (!config.silent) {
        this._publish("change:" + name, {value: value});
      }

      return true;
    },

    // ----------
    _observable: function(name, value) {
      zot.assert(!(name in this), '[zot.subscribable] observable must not already exist: ' + name);

      if (!this.__observables) {
        this.__observables = {};
      }

      zot.assert(!(name in this.__observables), '[zot.subscribable] observable must not already exist: ' + name);
      this.__observables[name] = {
        value: value
      };

      this[name] = function(newValue) {
        if (newValue === undefined)
          return this.__observables[name].value;

        this.__setOne(name, newValue);
      };
    }
  };
    
})();
