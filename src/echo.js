/**
 * @name echo
 * @license echo.js may be freely distributed under the MIT license.
 * @copyright (c) 2015 Alianza Inc.
 * @author Kent C. Dodds <kent@doddsfamily.us>
 */

// variable assignment
var isIE = (() => {
  var ua = window.navigator.userAgent;
  return ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0;
})();

const COLORS = {
  green: 'color:green',
  purple: 'color:rebeccapurple',
  blue: 'color:cornflowerblue',
  red: 'color:crimson',
  gray: 'color:#919191'
};
const LOG_FNS = ['log', 'info', 'debug', 'warn', 'error'];

var currentRank = 5;
var globallyEnabled = true;
var is = {};
['undefined', 'string', {name: 'fn', type: 'function'}, 'boolean', 'number'].forEach(function(name) {
  is[name.name || name] = (val) => typeof val === (name.type || name);
});
var echos = {};
var Echo = { create, get, remove, rank, enabled };

function create(name, {rank, defaultColor, colors, enabled, logger, logFns}) {
  // note, 6to5 doesn't support destructuring assignment default values
  // once that happens, this will look prettier :-)
  rank = !is.undefined(rank) ? rank : 5;
  enabled = !is.undefined(enabled) ? enabled : true;
  colors = !is.undefined(colors) ? colors : COLORS;
  logger = !is.undefined(logger) ? logger : console;
  logFns = !is.undefined(logFns) ? logFns : LOG_FNS;

  checkArgs(name, rank, defaultColor, colors, logger, logFns);

  // variable initialization
  var colorKeys = Object.keys(colors);

  // create echo
  var echo = wrapLog('log');

  // add functions
  echo.rank = echoRankGetterSetter;
  echo.enabled = echoEnabledGetterSetter;

  // add log functions to echo
  
  for (let fnName of logFns) {
    echo[fnName] = wrapLog(fnName);
  }

  // make developers happy
  echo.displayName = `echo: "${name}" abstraction on console`;
  echo.rank.displayName = 'echo.rank: getter/setter for the current level of logging (high is more)';
  logIt.displayName = 'echo log wrapper that checks whether the echo is enabled and if its rank is high enough compared to Echo.rank()';
  checkArgs.displayName = 'Echo.create arg checker that ensures all arguments are correct and throws errors if not';

  // add echo to echos
  echos[name] = echo;

  // return
  return echo;


  // function declarations
  function wrapLog(fnName) {
    function echoLog() {
      logIt(...[fnName, colors[defaultColor], ...arguments]);
    }
    echoLog.displayName = `console abstraction for ${name}:${fnName}`;
    addALittleColor(fnName, echoLog);
    return echoLog;
  }

  function addALittleColor(fnName, fn) {
    colorKeys.forEach(function(colorName) {
      fn[colorName] = function echoColoredLog() {
        logIt(...[fnName, colors[colorName], ...arguments]);
      };
      fn[colorName].displayName = `${colorName} colored console abstraction for ${name}:${fnName}`;
    });
  }

  function logIt(fnName, color, ...args) {
    if (globallyEnabled && enabled && highEnoughRank(rank)) {
      args = addColor(args, color);
      return logger[fnName].apply(logger, args);
    }
  }

  function echoRankGetterSetter(newRank) {
    return rank = setRank(rank, newRank);
  }

  function echoEnabledGetterSetter(newState) {
    return enabled = setEnabled(enabled, newState);
  }

  function checkArgs() {
    if (is.undefined(name)) {
      throw new Error('echo name must be defined');
    }
    if (!is.undefined(echos[name])) {
      throw new Error(`echo by the name of ${name} already exists. Cannot create another of the same name.`);
    }
    checkRank(rank);
    if (!is.undefined(defaultColor) && !is.string(colors[defaultColor])) {
      throw new Error(`echo defaultColor (value: ${defaultColor}) must be a string specified in colors (${Object.keys(colors)})`);
    }
    if (!Array.isArray(logFns)) {
      throw new Error('logFns must be an array of strings');
    }
    var missingSomething = logFns.some(function(logFn) {
      return !is.string(logFn) || !is.fn(logger[logFn]);
    });
    if (missingSomething) {
      throw new Error(`echo's logger (value: ${logger}) must implement these functions: ${logFns.join(', ')} (which must all be function names as strings)`);
    }
  }
}


function get(name) {
  if (is.undefined(name)) {
    return echos;
  } else {
    return echos[name];
  }
}

function remove(name) {
  if (is.undefined(name)) {
    echos = {};
  } else {
    delete echos[name];
  }
}

function enabled(newState) {
  return globallyEnabled = setEnabled(globallyEnabled, newState);
}

function rank(newRank) {
  return currentRank = setRank(currentRank, newRank);
}

// make developers happy
create.displayName = 'Echo.create: Makes a new instance of Echo';
get.displayName = 'Get an echo logger by name';
remove.displayName = 'Remove an echo logger';
rank.displayName = 'Set the global Echo rank. Must be a number 0-5 inclusive. 0 is less logs, 5 is more.';


// Main export
export default Echo;



// functions declarations
function addColor(args, color) {
  if (!isIE && color) {
    args.splice(1, 0, color);
    args[0] = '%c' + args[0];
  }
  return args;
}

function highEnoughRank(rank) {
  return currentRank >= rank;
}

function setRank(originalRank, newRank) {
  if (!is.undefined(newRank)) {
    checkRank(newRank);
    originalRank = newRank;
  }
  return originalRank;
}

function setEnabled(originalState, newState) {
  if (!is.undefined(newState)) {
    if (!is.boolean(newState)) {
      throw new Error(`echo.enabled must pass nothing or a boolean. "${newState}" was passed`);
    }
    originalState = newState;
  }
  return originalState;
}

function checkRank(rank) {
  if (!is.number(rank) || rank < 0 || rank > 5) {
    throw new Error(
      `echo rank (value: ${rank}) must be numbers between 0 and 5 (inclusive). 0 is less logs, 5 is more.`
    );
  }
}