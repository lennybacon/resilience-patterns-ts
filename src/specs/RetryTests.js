/**
 * A function that throws an exception.
 */
function failingFunc(){
  throw 'I failed!';
}

/**
 * A successful function.
 */
function successFunc(){
  return true;
}

/**
 * Build a function that fails X times before it succeeds.
 * @param  {number} numberOfFailures The number of times to fail.
 * @return {Function} the function with the expected behavior.
 */
function buildFailForFunc(numberOfFailures){
  var failCount = 0;
  return function(){
    if(++failCount <= numberOfFailures) {
      throw 'I failed!';
    } else{
      return true;
    }
  }
}

describe("When retry mock function is set up", function () {

  var failFunc = buildFailForFunc(3);

  it("Should fail before the threshold is met", function () {
    expect(failFunc).toThrow();
    expect(failFunc).toThrow();
    expect(failFunc).toThrow();
  });

  it("Should succeed after the threshold is met", function () {
    expect(failFunc()).toBe(true);
  });
});

describe("When retry is used", function () {

  var resilience = require("../target/js/resilience");
  var Retry = resilience.Retry;
  
  it("Should be loaded by require", function () {
    expect(!!Retry).toBe(true);
  }); 
  
    var r = new Retry()

  it("Should be constructable", function () {
    expect(!!r).toBe(true);
  });

  it("Should have an exec method on instance", function () {
    expect(!!r.exec).toBe(true);
  });

  it("Should be returning successful call values", function () {
    var value = r.exec(successFunc);
    expect(value).toBe(true);
  });

  it("Should be retried the given amount", function () {
    var failFunc = buildFailForFunc(3)
    var value = r.exec(failFunc);
    expect(value).toBe(true);
  });

  it("Should throw if the retry count exceeded", function () {
    var f = function(){r.exec(failingFunc)};
    expect(f).toThrow('I failed!');
  });
  
});