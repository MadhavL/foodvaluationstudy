/* 
Corsi plugin. to use and operate corsi block.
accepts sequences (in arrays). 
direction ("forward" or "backward") - to set if user need to repeat same suqence or backwards.
timing_response - how many second to wait from first click until moving to next step
*/
jsPsych.plugins['plugin-corsi'] = (function(){

    var plugin = {};

    plugin.trial = function(display_element, trial) {

        trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);
        display_element.append('<canvas id="myCanvas" width="800" height="600">Your browser does not support the HTML5 canvas tag.</canvas>');
        
        // var timeout to use when time elapsed more then needed.
        var setTimeoutHandlers = [];

        var lottery_selection;
        

        function Shape(x, y, w, h, fill) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.fill = fill;
        }

        function renderLottery(percentage, sure_bet, bet) {
            console.log("FIRED!")
            if (context) {
                context.reset();
            }
            let canvas = document.getElementById('myCanvas');
            context.fillStyle = `rgb(186, 229, 247)`; //Light blue - hard coded for now
            var rectangle_y_top = canvas.height*0.1;
            var rectangle_width = canvas.width*0.15;
            var rectangle_height = canvas.height*0.8;
            var left_rectangle_start = canvas.width*0.1;
            var right_rectangle_start = canvas.width*0.75;
            
            var cover_height = percentage * rectangle_height;
            var right_rectangle_bet_top = rectangle_y_top + cover_height;
            context.fillRect(left_rectangle_start, rectangle_y_top, rectangle_width, rectangle_height); //Left rect - Not covered (Sure thing)
            
            context.fillRect(right_rectangle_start, rectangle_y_top, rectangle_width, rectangle_height); //Right rect - Covered (bet)
            
            context.fillStyle = `rgb(247, 212, 186)`; //Salmon - hard coded for now
            context.fillRect(right_rectangle_start, rectangle_y_top, rectangle_width, cover_height); //Cover the right rectangle according to bet percentage

            context.fillStyle = "black";
            context.font = "18px sans-serif"

            context.fillText('Choose your option with the left or right arrow keys', canvas.width*0.3, 32);

            context.font = "26px sans-serif"

            // Sure bet text
            context.fillText(`\$${sure_bet}`, left_rectangle_start + 20, canvas.height*0.5);

            //Bet text
            context.fillText(`${percentage*100}%`, right_rectangle_start + 20, right_rectangle_bet_top - 26);
            context.fillText(`\$${bet}`, right_rectangle_start + 20, right_rectangle_bet_top);
            //0 text
            context.fillText(`${(1-percentage)*100}%`, right_rectangle_start + 20, rectangle_y_top + rectangle_height - 26);
            context.fillText(`\$0`, right_rectangle_start + 20, rectangle_y_top + rectangle_height);

            jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: lottery_choice_selected,
                valid_responses: [37, 39], //37 is left arrow, 39 is right arrow
                rt_method: 'date',
                persist: false,
                allow_held_key: false
              });
        }
        
        // get canvas element.
        var elem = document.getElementById('myCanvas');
        if (elem && elem.getContext) {

            // list of rectangles to render for corsi
            var rects = [];
            rects.push(new Shape(20, 20, 100, 100, "#333"));  //building the rectangels
            rects.push(new Shape(400, 15, 100, 100, "#333"));
            rects.push(new Shape(650, 50, 100, 100, "#333"));
            rects.push(new Shape(260, 120, 100,100, "#333"));
            rects.push(new Shape(600,300,100,100,"#333"));
            rects.push(new Shape(150,320,100,100,"#333"));
            rects.push(new Shape(15,400,100,100,"#333"));
            rects.push(new Shape(200,450,100,100,"#333"));
            rects.push(new Shape(450,400,100,100,"#333"));
            rects.push(new Shape(660,450,100,100,"#333"));
        
            // get context
        var context = elem.getContext('2d');
        /* if (context) {

            for (var i = 0, len = rects.length; i < len; i++) {
                //display_element.append[rects[i]];
                context.fillRect(rects[i].x, rects[i].y, rects[i].w, rects[i].h);
            }

        } */
        }

        //display_element.append('<p>This is the first paragraph</p>');
        //display_element.append('<p>This is the second paragraph</p>');
        function change_color(rect, color_delay, black_delay, color) {
            //Change Color, after a delay
            setTimeout(
                function() {
                    context.fillStyle= color;
                    context.fillRect(rect.x,rect.y,rect.w,rect.h);
                },
                color_delay); 
            
            
            //Meka black, after a delay
            setTimeout(
                function() {
                    context.fillStyle="Black";
                    context.fillRect(rect.x,rect.y,rect.w,rect.h);
                },
                black_delay); 
        }

        //Change color of rect when clicked
        function change_c(rect, color, correct, enabled) {
            if (enabled) {
                if (correct) {
                    context.fillStyle= "Green"
                }
                else {
                    context.fillStyle = "Red"
                }
            }
            else {
                context.fillStyle= color;
            }
            context.fillRect(rect.x,rect.y,rect.w,rect.h);
            var myVar = setTimeout(function(){
            context.fillStyle="Black";
            context.fillRect(rect.x,rect.y,rect.w,rect.h);
            }, trial.color_change_time); 
        }

        function showRectangles() {
            //alert("Ready?");
            // document.removeEventListener("mousedown", showRectangles);
            document.getElementById("trial_start_button").removeEventListener('click', showRectangles);
            document.getElementById("trial_start_button").remove();
            // $("#readyPopup").remove();
            
            var rectTrial = trial.stimulus;
            console.log(rectTrial);
            var rectstr=[];
            stay_yellow = trial.color_change_time; //Make this a parameter of the plugin
            inter_trial = stay_yellow + trial.delay_between_squares; //Make this a parameter of the plugin
            counter1 = 0;
            counter2 = stay_yellow;
            for (var i=0; i<rectTrial.length; i++) {
                console.log("FIRED");
                rectangle=rectTrial[i];
                rectstr.push(rectangle);
                console.log(rectstr);
                change_color(rects[rectangle],counter1,counter2, trial.change_color);
                counter1 = counter1 + inter_trial
                counter2 = counter2 + inter_trial
            }
            // build a function that wil listen to mouse clicks just after sequence was finished
            setTimeout(function() {
                console.log("Timeout called");
                // document.getElementById("myCanvas").addEventListener('click', checkCol);
                // start_response_timer();
                if (trial.direction == "forward") {
                    display_element.append("<button type=\"button\" class=\"jspsych-btn\" style=\"position: absolute; top: 50%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 18px\" id=\"response_start_button\">Enter Response in Forward Direction</button>");
                }
                else {
                    display_element.append("<button type=\"button\" class=\"jspsych-btn\" style=\"position: absolute; top: 50%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 18px\" id=\"response_start_button\">Enter Response in Backward Direction</button>");
                }
                // document.addEventListener('mousedown', showRectangles);
                document.getElementById("response_start_button").addEventListener('click', start_response_timer);
            }, counter2 - inter_trial);  
                
                return rectstr;
        }

        function showRectangles_Half() {
            //alert("Ready?");
            // document.removeEventListener("mousedown", showRectangles);
            document.getElementById("trial_start_button_half").removeEventListener('click', showRectangles);
            document.getElementById("trial_start_button_half").remove();
            // $("#readyPopup").remove();
            
            var rectTrial = trial.stimulus;
            console.log(rectTrial);
            var rectstr=[];
            stay_yellow = trial.color_change_time; //Make this a parameter of the plugin
            inter_trial = stay_yellow + trial.delay_between_squares; //Make this a parameter of the plugin
            counter1 = 0;
            counter2 = stay_yellow;
            for (var i=0; i<rectTrial.length; i++) {
                console.log("FIRED");
                rectangle=rectTrial[i];
                rectstr.push(rectangle);
                console.log(rectstr);
                change_color(rects[rectangle],counter1,counter2, trial.change_color);
                counter1 = counter1 + inter_trial
                counter2 = counter2 + inter_trial
            }
            // build a function that wil listen to mouse clicks just after sequence was finished
            setTimeout(function() {
                console.log("Timeout called");
                // document.getElementById("myCanvas").addEventListener('click', checkCol);
                // start_response_timer();
                display_element.append("<button type=\"button\" class=\"jspsych-btn\" style=\"position: absolute; top: 50%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 18px\" id=\"continue_lottery_button\">Continue</button>");
                // document.addEventListener('mousedown', showRectangles);
                document.getElementById("continue_lottery_button").addEventListener('click', () => {
                    document.getElementById("continue_lottery_button").removeEventListener('click', showRectangles);
                    document.getElementById("continue_lottery_button").remove();
                    renderLottery(trial.lottery_percentage, trial.lottery_sure_bet, trial.lottery_bet)
                });
            }, counter2 - inter_trial);  
                
                return rectstr;
        }

        function showRectangles_Second_Half() {
            if (context) {
                context.reset();

                for (var i = 0, len = rects.length; i < len; i++) {
                    //display_element.append[rects[i]];
                    context.fillRect(rects[i].x, rects[i].y, rects[i].w, rects[i].h);
                }
    
            }            
                
            if (trial.direction == "forward") {
                display_element.append("<button type=\"button\" class=\"jspsych-btn\" style=\"position: absolute; top: 50%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 18px\" id=\"response_start_button\">Enter Response in Forward Direction</button>");
            }
            else {
                display_element.append("<button type=\"button\" class=\"jspsych-btn\" style=\"position: absolute; top: 50%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 18px\" id=\"response_start_button\">Enter Response in Backward Direction</button>");
            }
            // document.addEventListener('mousedown', showRectangles);
            document.getElementById("response_start_button").addEventListener('click', start_response_timer);
             
                
            return rectstr;
        }



        var lottery_choice_selected = function(info) {
            //37 is left, 39 is right
            if (info.key == 37) {
                lottery_selection = "safe"
            }
            else {
                lottery_selection = "lottery"
            }
            
            if (trial.mode == 0) {
                start_full_corsi();
            }
            else if (trial.mode == 1) {
                showRectangles_Second_Half();
            }
            
      
        };

        function start_full_corsi() {
            // Start with half of corsi first
            if (context) {
                context.reset();

                for (var i = 0, len = rects.length; i < len; i++) {
                    //display_element.append[rects[i]];
                    context.fillRect(rects[i].x, rects[i].y, rects[i].w, rects[i].h);
                }
    
            }

            // display_element.append("<div id=\"readyPopup\">" + "<div dir='rtl'> Click on screen when ready </div>"  + "</div>");
            display_element.append("<button type=\"button\" class=\"jspsych-btn\" style=\"position: absolute; top: 50%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 28px\" id=\"trial_start_button\">Start Experiment</button>");
            // document.addEventListener('mousedown', showRectangles);
            document.getElementById("trial_start_button").addEventListener('click', showRectangles);
        }

        function start_half_corsi() {
            // Start with half of corsi first
            if (context) {
                context.reset();

                for (var i = 0, len = rects.length; i < len; i++) {
                    //display_element.append[rects[i]];
                    context.fillRect(rects[i].x, rects[i].y, rects[i].w, rects[i].h);
                }
    
            }

            // display_element.append("<div id=\"readyPopup\">" + "<div dir='rtl'> Click on screen when ready </div>"  + "</div>");
            display_element.append("<button type=\"button\" class=\"jspsych-btn\" style=\"position: absolute; top: 50%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 28px\" id=\"trial_start_button_half\">Start Experiment</button>");
            // document.addEventListener('mousedown', showRectangles);
            document.getElementById("trial_start_button_half").addEventListener('click', showRectangles_Half);
        }
        
        //2nd function called in plugin to start the trial
        function runTrial() {
            // Depending on trial mode (NO WM LOAD VS WM LOAD), have 2 separate flows

            if (trial.mode == 0) {
                // Start with lottery, then go to corsi
                renderLottery(trial.lottery_percentage, trial.lottery_sure_bet, trial.lottery_bet);

                // jsPsych.pluginAPI.getKeyboardResponse({
                //     callback_function: lottery_choice_selected,
                //     valid_responses: [37, 39], //37 is left arrow, 39 is right arrow
                //     rt_method: 'date',
                //     persist: false,
                //     allow_held_key: false
                //   });
                
            }
            else {
                //
                start_half_corsi()
            }

            
        }

        function start_response_timer() {
            document.getElementById("response_start_button").removeEventListener('click', showRectangles);
            document.getElementById("response_start_button").remove();
            document.getElementById("myCanvas").addEventListener('click', checkCol);
            if (trial.direction == "forward") {
                display_element.append("<div id=\"response_header\" style=\"position: absolute; top: 5%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 28px\">Forward</div>");            
            }
            else {
                display_element.append("<div id=\"response_header\" style=\"position: absolute; top: 5%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 28px\">Backward</div>");            
            }
            start_time = (new Date()).getTime();
            var timer = setTimeout(
                function() {
                        end_trial(true);
                    }, 
                trial.timing_response);
            setTimeoutHandlers.push(timer)
        }
        
        // function to check collision
        function collides(rects, x, y) {
            var isCollision = false;
            for (var i = 0, len = rects.length; i < len; i++) {
                var left = rects[i].x, right = rects[i].x+rects[i].w;
                var top = rects[i].y, bottom = rects[i].y+rects[i].h;
                if (right >= x
                    && left <= x
                    && bottom >= y
                    && top <= y) {
                    isCollision = rects[i];
                }
            }
            
            return isCollision;
        }
        
        
        //if(JSON.stringify(trial.choices) != JSON.stringify(["none"])) {
        // elem.addEventListener('click', checkCol);

        // function that do things if collision occured.
        function checkCol(e) {
            console.log('click: ' + e.offsetX + '/' + e.offsetY);
            var canvas = $('#myCanvas');
            console.log('click: ' + (e.offsetX - canvas.offset().left) + '/' + (e.offsetY - canvas.offset().top));
            var rect = collides(rects, e.offsetX, e.offsetY);
            if (rect) {
                let correct = false;
                if (trial.direction == "forward") {
                    correct = rects.indexOf(rect) == trial.stimulus[responseSet.length]
                }
                else if (trial.direction == "backward") {
                    correct = rects.indexOf(rect) == trial.stimulus[trial.stimulus.length - responseSet.length - 1]
                }
                change_c(rect, trial.change_color, correct, trial.show_correct);
                responseSet.push(rect);
                respCount=respCount+1;
                // setting timer if pressed one time and waited
                // if (respCount>=1) {
                //     if (trial.timing_response > 0) {
                //     var t2 = setTimeout(function() {
                //         end_trial();
                //     }, trial.timing_response);
                //     setTimeoutHandlers.push(t2);
                //     }
                // }
                if (responseSet.length >= trial.stimulus.length) {
                    end_trial(false);
                } else {
                    responseSet = responseSet;
                    console.log('collision: ' + rect.x + '/' + rect.y);
                }
            } else {
                console.log('no collision');
                //response.push(rect);
            }
        }
        
        //First function called in plugin
        function runBlock() {
            respCount=[]; // counter for responses
            responseSet=[]; //check what was pressed
            rectstr = runTrial();
        }
        
        

        var response = {rt: -1, key: -1};

        
        var end_trial = function(timeout) {
            document.getElementById("myCanvas").removeEventListener('click',checkCol,false);
            document.getElementById("response_header").remove();
            // kill any remaining setTimeout handlers
            for (var i = 0; i < setTimeoutHandlers.length; i++) {
                clearTimeout(setTimeoutHandlers[i]);
            }
            // check if the sequence that was pressed is identical to the one that was presented
            var correctAns = 0;
            
            if (!timeout) {
                rectCompare=[]

                if (trial.direction == "forward") {
                    for (i=0;i<responseSet.length;i++) {
                        rectCompare.push(rects[trial.stimulus[i]]);
                    } 
                } else if (trial.direction == "backward") {
                    for (var i=(responseSet.length-1); i>=0; i--) {
                        rectCompare.push(rects[trial.stimulus[i]]);
                    }
                } else {
                    console.log("Not valid");
                }
            
                if (JSON.stringify(responseSet) === JSON.stringify(rectCompare)) {
                    correctAns = 1;
                    console.log("Ok");
                    display_element.append("<div id=\"response_feedback\" style=\"position: absolute; top: 5%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 28px\">Correct</div>");      
                } else {
                    correctAns = 0;
                    display_element.append("<div id=\"response_feedback\" style=\"position: absolute; top: 5%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 28px\">Incorrect</div>");            
                    console.log("mistake");
                }

                setTimeout(function() {
                    document.getElementById("response_feedback").remove();
                }, 2000)  
            }
            else {
                console.log("Timed out!")
            }
            response = []
            for (rect of responseSet) {
                response.push(rects.indexOf(rect))
            }
            
            // save data
            var trial_data = {
                "trial_order": trial.mode,
                "rt": (new Date()).getTime() - start_time,
                "stimulus": trial.stimulus,
                "response": response,
                "direction": trial.direction,
                "correctAns": correctAns,
                "blocks": rects,
                "screenWidth": window.innerWidth,
                "screenHeight": window.innerHeight,
                "lottery_selection": lottery_selection,
            };

            setTimeout(
                function () {
                    display_element.html('');
                    try {
                        jsPsych.finishTrial(trial_data);
                      } catch (error) {
                        
                      }
                    
                },
                2000);
        }
        
        runBlock();
        
        console.log(trial.stimulus);
    
}

    return plugin;

  })();
 