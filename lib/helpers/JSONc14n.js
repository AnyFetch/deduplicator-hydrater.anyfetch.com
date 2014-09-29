'use strict';

module.exports = {
  stringify: function(obj) {
    var json_string;
    var keys;
    var i;

    switch(this.get_type(obj)){
      case "[object Array]":
        json_string = "[";
        for(i = 0; i < obj.length; i += 1){
            json_string += this.stringify(obj[i]);
            if(i < obj.length - 1) {
              json_string += ",";
            }
        }
        json_string += "]";
        break;
      case "[object Object]":
        json_string = "{";
        keys = Object.keys(obj);
        keys.sort();
        for(i = 0; i < keys.length; i += 1){
            json_string += '"' + keys[i] + '":' + this.stringify(obj[keys[i]]);
            if(i < keys.length - 1) {
              json_string += ",";
            }
        }
        json_string += "}";
        break;
      case "[object Number]":
        json_string = obj.toString();
        break;
      case "[object Null]":
        json_string = "null";
        break;
      default:
        json_string = '"' + obj.toString().replace(/["\\]/g, (function(_this){
          return function(character){
            return _this.escape_character.apply(_this, [character]);
          };
        })(this)) + '"';
    }
    return json_string;
  },
  get_type: function(thing) {
    if(thing === null) {
      return "[object Null]";
    }

    return Object.prototype.toString.call(thing);
  },
  escape_character: function(character) {
    return this.escape_characters[character];
  },
  escape_characters: {
    '"': '\\"',
    '\\': '\\\\'
  }
};