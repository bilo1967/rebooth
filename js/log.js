var saveLog = '';
var originalConsole = window.console; // reference to console.log function

// PolyFill
Date.prototype.toTimeStamp = Date.prototype.toTimeStamp || function() {
    return String(this.getDate()).lpad(2)
    + '/' + String(this.getMonth() + 1).lpad(2) 
    + '/' + this.getFullYear() 
    + ' ' + String(this.getHours()).lpad(2)
    + ':' + String(this.getMinutes()).lpad(2)
    + ':' + String(this.getSeconds()).lpad(2)
    ;
};

String.prototype.lpad = String.prototype.lpad || function(digits, fill) {
    var str, pad;
    
    fill = fill == null ? '0' : fill;
    str  = '' + this;
    pad = fill.repeat(digits);

    return pad.substring(0, pad.length - str.length) + str;
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
        log: function(msg) {
            
            var err = new Error;
            var d = new Date();
            
            var args = Array.from(arguments);
            if (Number.isInteger(args[0])) {
                if (args[0] > DebugLevel) return;
                args.shift();
            }

            var {script, line, column} = parseErrorStack(err);
            script = script ? script.replace(/.*\//, '').replace(/\?.*/, '') : '';

            var t = _dump(args)
            var mark = '[' + d.toTimeStamp() + " - log - " + script + ":" + line + "]";
            
            args.unshift(mark);

            this.saveLog += mark + " " + t + "\n";
            
            originalConsole.log.apply(originalConsole, args);

            sendToServer(d.toTimeStamp(), 'log', script, line, column, t);
        },
        warn: function(msg) {
            var err = new Error;
            var d = new Date();
            
            var args = Array.from(arguments);

            var {script, line, column} = parseErrorStack(err);
            script = script ? script.replace(/.*\//, '').replace(/\?.*/, '') : '';

            var t = _dump(args)
            var mark = '[' + d.toTimeStamp() + " - warn - " + script + ":" + line + "]";
            
            args.unshift(mark);

            this.saveLog += mark + " " + t + "\n";
            
            originalConsole.warn.apply(originalConsole, args);

            sendToServer(d.toTimeStamp(), 'warn', script, line, column, t);

        },
        error: function(msg){
            var err = new Error;
            var d = new Date();
            
            var args = Array.from(arguments);

            var {script, line, column} = parseErrorStack(err);
            script = script ? script.replace(/.*\//, '').replace(/\?.*/, '') : '';

            var t = _dump(args)
            var mark = '[' + d.toTimeStamp() + " - error - " + script + ":" + line + "]";
            
            args.unshift(mark);

            this.saveLog += mark + " " + t + "\n";
            
            originalConsole.error.apply(originalConsole, args);

            sendToServer(d.toTimeStamp(), 'error', script, line, column, t);
        },
        syserr: function(msg){
            var err = new Error;
            var d = new Date();
            
            var args = Array.from(arguments);

            var {script, line, column} = parseErrorStack(err);
            script = script ? script.replace(/.*\//, '').replace(/\?.*/, '') : '';

            var t = _dump(args)
            var mark = '[' + d.toTimeStamp() + " - syserr - " + script + ":" + line + "]";
            
            this.saveLog += mark + " " + t + "\n";
            
            sendToServer(d.toTimeStamp(), 'syserr', script, line, column, t);

        },
        olog: function() {
            originalConsole.log.apply(originalConsole, arguments);
        },        
        owarn: function() {
            originalConsole.warn.apply(originalConsole, arguments);
        },
        oerror: function() {
            originalConsole.error.apply(originalConsole, arguments);
        },
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





