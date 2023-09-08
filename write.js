









 if(user.completion[number] === 'started') {
                if(completion === 'started') {
                  console.log('no');  
                } else if(completion === 'finish') {
                    user.started = user.started - 1
                    user.finish = user.finish + 1              
                } else if(completion === 'complete') {
                    user.started = user.started - 1
                    user.complete = user.complete + 1     
                }
            } else if(user.completion[number] === 'finish') {
                if(completion === 'finish') {
                  console.log('no');  
                } else if(completion === 'started') {
                    user.started = user.started + 1
                    user.finish = user.finish - 1              
                } else if(completion === 'complete') {
                    user.finish = user.finish - 1
                    user.complete = user.complete + 1     
                }
            } else if(user.completion[number] === 'complete') {
                if(completion === 'complete') {
                  console.log('no');  
                } else if(completion === 'started') {
                    user.started = user.started + 1
                    user.complete = user.complete - 1              
                } else if(completion === 'finish') {
                    user.finish = user.finish + 1
                    user.complete = user.complete - 1     
                }
            } 
            user.completion[number] = completion




