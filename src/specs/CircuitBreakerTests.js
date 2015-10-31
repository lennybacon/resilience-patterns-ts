/**
 * A function that throws an exception.
 */
function failingFunc(){
  throw {name: 'Error', message: 'I failed!'};
}

/**
 * A successful function.
 */
function successFunc(){
  return true;
}

function sleep(millis)
{
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}

describe("When circuit breaker is used", function () {

  var resilience = require("../target/js/resilience");
  var CircuitBreaker = resilience.CircuitBreaker;

  it("Should be loaded by require", function () {
    expect(!!CircuitBreaker).toBe(true);
  });

  var cb = new CircuitBreaker();

  it("Should be constructable", function () {
    expect(!!cb).toBe(true);
  });

  it("Should have a failure threshold of 5", function () {
    expect(cb.getFailureThreshold()).toBe(5);
  });

  it("Should have a timeout of 60000", function () {
    expect(cb.getTimeout()).toBe(60000);
  });
  
  it("Should have a service level of 100", function () {
    expect(cb.getServiceLevel()).toBe(100);
  });
  
  it("Should have 0 ignored exceptions", function () {
    expect(cb.getIgnoredExceptions().length).toBe(0);
  });
 
  it("Should have a success count of 0", function () {
    expect(cb.getSuccessCount()).toBe(0);
  });
  
  it("Should have a failure count of 0", function () {
    expect(cb.getFailureCount()).toBe(0);
  });
    
  it("Should be in initial state closed", function () {
    expect(cb.getState()).toBe(resilience.circuitBreakerState.closed);
  });

  it("Should have exec method", function () {
    expect(!!cb.exec).toBe(true);
  });
  
  it("Should return value of successful operation", function () {
    expect(cb.exec(successFunc)).toBe(true);
  });
  
  it("Should return null on failing operation", function () {
    expect(cb.exec(failingFunc)).toBe(null);
  });
  
  it("Should have failure count of 0 after reset", function () {
    var cb1 = new CircuitBreaker();
    cb1.exec(failingFunc);
    cb1.reset();
    expect(cb1.getFailureCount()).toBe(0);
    expect(cb.getState()).toBe(resilience.circuitBreakerState.closed);
  });
  
  it("Should increment failing count on failing operation", function () {
    var cb1 = new CircuitBreaker();
    cb1.exec(failingFunc);
    expect(cb1.getFailureCount()).toBe(1);
  });
  
  it("Should throw exception after threshold is met", function () {
    var cb1 = new CircuitBreaker();
    for (var i = 0; i < cb1.getFailureThreshold()-1; i++) {
      cb1.exec(failingFunc);
    }
    expect(function(){ cb1.exec(failingFunc); }).toThrow( { name: 'Error', message: 'Circuit opened', innerException: {name: 'Error', message: 'I failed!'}});
    expect(cb1.getState()).toBe(resilience.circuitBreakerState.open);
  });
 
 it("Should increment success count", function () {
    var cb1 = new CircuitBreaker();
    cb1.exec(successFunc);
    expect(cb1.getSuccessCount()).toBe(1);
  });
 
  it("Should calculate service level when all calls succeed", function () {
    var cb1 = new CircuitBreaker();
    cb1.exec(successFunc);
    expect(cb1.getServiceLevel()).toBe(100);
  });
 
  it("Should calculate service level when half calls succeed", function () {
    var cb1 = new CircuitBreaker();
    cb1.exec(successFunc);
    cb1.exec(failingFunc);
    expect(cb1.getServiceLevel()).toBe(50);
  });

  it("Should reopen after timeout exceeds", function () {
    var cb1 = new CircuitBreaker(5,1, 1000);
    cb1.exec(failingFunc);
    sleep(1000);
    expect(cb1.getState()).toBe(resilience.circuitBreakerState.closed);
  });

  it("Should skip ignored exceptions", function () {
    var cb1 = new CircuitBreaker(5,1, 1000);
    cb1.addIgnoredException({name: 'Error', message: 'I failed!'});
    
    expect(function(){ cb1.exec(failingFunc); }).toThrow({name: 'Error', message: 'I failed!'});
    
    expect(cb1.getSuccessCount()).toBe(0);
    expect(cb1.getFailureCount()).toBe(0);
    expect(cb1.getServiceLevel()).toBe(100);
  });
    
});