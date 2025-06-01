// This chrono ticks every "resolution" milliseconds
class MyChrono {
    
    intervalId         = null;
    startTime          = 0;
    elapsed            = 0;
    elapsedAtLastPause = 0;
    onUpdateFunction   = null;
    resolution         = 10;
    intervalValue      = 1;
    countDown          = null; // not yet implemented
    status             = 'stopped';
    
    constructor(r = 10, onUpdate = null) {
        if (isNaN(r) || r <= 0) throw Error("Chrono resolution is not a positive number");
        if (onUpdate != null && typeof onUpdate != 'function') throw Error("onUpdate is not a function");
        
        this.resolution = r;
        this.intervalValue = Math.max(1, parseInt(r/10));
        if (onUpdate) this.onUpdateFunction = onUpdate;
    }
    
    // getter
    get value() {
        return Math.floor((this.elapsed + this.elapsedAtLastPause)/this.resolution);
    }
    
    
    clear() {
        this.elapsed = 0;
        this.elapsedAtLastPause = 0;
        this.startTime = 0;
        this.status = 'stopped';
        clearInterval(this.intervalId);
        this.intervalId = null;
        if (this.onUpdateFunction) this.onUpdateFunction(0);
    }
    
    intervalFunction() {
        let t = (new Date()).getTime() - this.startTime;
        if (Math.floor(t/this.resolution) == Math.floor(this.elapsed/this.resolution)) return;
        this.elapsed = t;
        if (this.onUpdateFunction) this.onUpdateFunction(this.value);
    }
    
    // setter for onUpdate event
    set onUpdate(f) {
        if (typeof f === 'function') {
            this.onUpdateFunction = f;
        }
    }
    
    
    start() {
        if (this.status != 'stopped') return;
        
        this.startTime = (new Date()).getTime();
        this.elapsed = 0;
        this.elapsedAtLastPause = 0;
        
        if (this.intervalId) clearInterval(this.intervalId);
        if (this.onUpdateFunction) this.onUpdateFunction(0);
        
        this.intervalId = setInterval(this.intervalFunction.bind(this), this.intervalValue);
        this.status = 'running';
    }
    
    stop () {
        if (this.status == 'stopped') return;
        
        if (this.status == 'running') {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.elapsed = (new Date()).getTime() - this.startTime;
        } else {
            // paused
            this.elapsed = 0;
        }

        if (this.onUpdateFunction) this.onUpdateFunction(this.value);
        this.startTime = 0;
        this.elapsed = 0;
        
        this.status = 'stopped';
    }
    
    pause() {

        if (this.status != 'running') return;
        
        clearInterval(this.intervalId);
        
        this.intervalId = null;
        
        this.elapsed = (new Date()).getTime() - this.startTime;
                       
        if (this.onUpdateFunction) this.onUpdateFunction(this.value);
        
        this.elapsedAtLastPause += this.elapsed;
        this.startTime = (new Date()).getTime();
        
        this.elapsed = 0;
        
        this.status = 'paused';
        
    }
    
    resume() {
        if (this.status != 'paused') return;
        
        this.startTime = (new Date()).getTime();
        this.elapsed = 0;
        
        if (this.onUpdateFunction) this.onUpdateFunction(this.value);
        
        this.intervalId = setInterval(this.intervalFunction.bind(this), this.intervalValue);
        
        this.status = 'running';
    }
};


export default MyChrono;

// Global loading, if this is not included by a module
if (typeof globalThis !== 'undefined' && !globalThis.MyChrono) {
    globalThis.MyChrono = MyChrono;
}









