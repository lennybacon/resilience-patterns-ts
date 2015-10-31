module resilience {
  
  export enum circuitBreakerState {
    closed = 0,
    halfOpen = 1,
    open = 2
  };

  export interface IgnoredException {
    message: string;
  }

  
  export class CircuitBreaker {

    private _failureCount = 0;
    private _successCount = 0;
    private _recoveryCount = 0;
    private _failureThreshold;
    private _recoveryThreshold;
    private _timeout;
    private _ignoredExceptions = [];
    private _state = circuitBreakerState.closed;
    private _timer = null;

    constructor(
      failureThreshold : number = 5,
      recoveryThreshold : number = 1,
      timeout : number = 60000
    ){
      this._failureThreshold = failureThreshold;
      this._recoveryThreshold = recoveryThreshold;
      this._timeout = timeout;
    };
   
    private changeState(newState) : void {
      var before = this._state;
      this._state = newState;
      this.onCircuitBreakerStateChanged(before, newState);
    };

    private incrementRecoveryCount() : void {
      if (this._state !== circuitBreakerState.halfOpen) {
        return;
      }
      this._recoveryCount++;
      if (this._recoveryCount < this._recoveryThreshold) {
        return;
      }
      if (this._state === circuitBreakerState.closed) {
        return;
      }
      this.reset();
    };
        
    private incrementSuccessCount() : void {
      var before = this.getServiceLevel();
      this._successCount++;
      var after = this.getServiceLevel();
      this.onServiceLevelChanged(before, after);
    };
        
    private incrementFailureCount() : void{
      var before = this.getServiceLevel();
      this._failureCount++;
      var after = this.getServiceLevel();
      this.onServiceLevelChanged(before, after);
    }
        
    private timerElapsed() : void{
      if (this._state !== circuitBreakerState.open) {
        return;
      }
      this.changeState(circuitBreakerState.halfOpen);
      this._recoveryCount = 0;
      clearTimeout(this._timer);    
    }
        
    private trip() : boolean{
      if (this._state === circuitBreakerState.open)
      {
        return false;
      }
      this.changeState(circuitBreakerState.open);
      this._timer = setTimeout(this.timerElapsed, this._timeout);
      return true;
    };
        
    private tripAndThrow(ex) : void{
      if(this.trip()){
        throw { name: 'Error', message: 'Circuit opened', innerException: ex };     
      }
    };
        
    private handleException(ex){
      if (this._state === circuitBreakerState.halfOpen) {
        this.tripAndThrow(ex);
        return;
      }
      if (this._failureCount < this._failureThreshold){
        this.incrementFailureCount();
      }
      if (this._failureCount >= this._failureThreshold)
      {
        this.tripAndThrow(ex);
      }
    };
    
    onCircuitBreakerStateChanged(before : circuitBreakerState, newState : circuitBreakerState){
            
    };
        
    onServiceLevelChanged(before : number, newState : number){
            
    };
    
    getFailureCount = function() : number {
      return this._failureCount;
    };
    getSuccessCount = function() : number {
      return this._successCount;
    };
    getRecoveryCount = function() : number {
      return this._recoveryCount;  
    };
    getFailureThreshold = function() : number {
      return this._failureThreshold;  
    };
    getRecoveryThreshold = function() : number {
      return this._recoveryThreshold;
    };
    getTimeout = function() : number {
      return this._timeout;
    };
    getIgnoredExceptions = function() : string[] {
      return this._ignoredExceptions; 
    };
    addIgnoredException = function(ex : IgnoredException) : void{
      this._ignoredExceptions.push(ex.message);
    };
    getState() : circuitBreakerState{
      return this._state; 
    };
    reset(){
      this._failureCount = 0;
      this._successCount = 0;
      this._recoveryCount = 0;
      this.changeState(circuitBreakerState.closed);
      clearTimeout(this._timer);
    };
    getServiceLevel() : number{
      var totalCalls = this._failureCount + this._successCount;
      if (totalCalls === 0)
      {
        return 100;
      }
      if (this._successCount === 0)
      {
        return 0;
      }
      if (totalCalls === this._successCount)
      {
        return 100;
      }
      if (this._failureCount === 0)
      {
        return 100;
      }
      return this._failureCount / (totalCalls / 100);
    };
        
    exec(func) : any{
      try{
        var result = func();
        this.incrementRecoveryCount();
        this.incrementSuccessCount();
        return result;
      }
      catch(ex){
        if (this._ignoredExceptions.indexOf(ex.message) > -1)
        {
            throw ex;
        }
        this.handleException(ex);
        return null;
      }
    }
  }
}