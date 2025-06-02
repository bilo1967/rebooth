//
//
//

const originalConsole = window.console; // reference to console.log function

// Console methods mapping
const consoleMethods = {
  log: originalConsole.log,
  warn: originalConsole.warn,
  error: originalConsole.error,
  syserr: () => {},
};


function logTimeStamp(date) {
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const loopReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};

function _dump() {
    var txt = '';
    for (var i = 0; i < arguments[0].length; i++) {
        txt += (typeof arguments[0][i] == 'object' ? JSON.stringify(arguments[0][i], loopReplacer()/*, 2*/) : arguments[0][i]);
        
    };    
    return txt;
}   


window.onerror = function(message, source, lineno, colno, error) {
    
    if (typeof window.console.syserr === "function") {
        window.console.syserr(
            '"' + message + '"' +
            ' in ' + source + 
            ' at line ' + lineno + 
            ', column ' + colno
        );
    }
}




function redirectConsole(init = '', sendToServer = () => {} ) {
    
    window.console = {

        saveLog: init,

        _log: function(type, ...args) {
            const err = new Error();
            const d = new Date();

            const { script, line, column } = parseErrorStack(err);
            const cleanScript = script ? script.replace(/.*\//, '').replace(/\?.*/, '') : '';

            const t = _dump(args);
            const mark = `[${logTimeStamp(d)} - ${type} - ${cleanScript}:${line}]`;

            args.unshift(mark);

            this.saveLog += `${mark} ${t}\n`;

            // Chiama il metodo corretto di console in base al tipo
            consoleMethods[type].apply(originalConsole, args);

            sendToServer(logTimeStamp(d), type, cleanScript, line, column, t);
        },

        log:    function(...args) { this._log('log',    ...args); },
        warn:   function(...args) { this._log('warn',   ...args); },
        error:  function(...args) { this._log('error',  ...args); },
        syserr: function(...args) { this._log('syserr', ...args); },            

        olog:   function(...args) { originalConsole.log.apply(originalConsole, args); },        
        owarn:  function(...args) { originalConsole.warn.apply(originalConsole, args); },
        oerror: function(...args) { originalConsole.error.apply(originalConsole, args); },

        get: function() {
            return this.saveLog;
        },
    };
    
    sendToServer('', '', '', '', '', init);    
}

function restoreConsole() {
    window.console = originalConsole;
};


// Error stack format may vary for different browsers.
// The following lines should work for chrome and derivatives,
// firefox and safari. It has not been tested with other browsers
function parseErrorStack(errObject) {

    // Get caller line from stack
    let stack = errObject.stack.split("\n");
    let caller = stack[0] == "Error" ? stack[2] : stack[1];

    // parse the column
    let p = caller.lastIndexOf(":");
    let col = parseInt(caller.substring(p + 1));
    caller = caller.slice(0, p)

    // parse the line number
    p = caller.lastIndexOf(":");
    let line = caller.substring(p + 1);
    caller = caller.slice(0, p)

    // parse the file name
    let match = /[a-z]+:\/\//.exec(caller); // match anyprotocol://
    let file = caller.substring(match.index + match[0].length);

    return {script: file, line: line, column: col};
}
