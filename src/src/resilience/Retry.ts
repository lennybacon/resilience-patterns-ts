module resilience {
   
  export class Retry {
    
      private sleep(millis : number)
      {
        let d : number = +new Date();
        let curDate : number = null;
        do { 
          curDate = +new Date(); 
        }
        while(curDate - d < millis);
      }
      
      exec(func : Function, amount : number, delays : number[]) : any {
        if(!amount){
          amount = 3;
        }
        if(!delays){
          delays = [1000];
        }

        if(amount > delays.length){
          for (var i = 0; i < amount; i++) {
            if(delays.length < i+1){
              delays.push(delays[delays.length-1]);
            }
          }
        }
        let success = false;
        let retries = 0;
        let value = null;
        do{
          try{
            value = func();
            success = true;
          } catch(e){
            if(retries >= amount){
              throw e;
            }
            this.sleep(delays[retries]);
          }
          retries++;
        } while(!success || retries < amount);
        return value;
      }

  }
}