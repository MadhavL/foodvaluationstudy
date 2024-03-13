function process_exp_data(json_data){
    for (result of json_data) {
        if (result['trial_type'] == "plugin-corsi"){
            console.log(`Trial Order: ${result['trial_order']}\nReaction time: ${result.rt}\nCorsi original order: ${result['stimulus']}\nCorsi response order: ${result['direction']}\nCorsi response: ${result['response']}\nCorsi correct answer: ${result['correctAns']}\nLottery selection: ${result['lottery_selection']}`)
            //Can add other details: screen width, screen height, block details
        }
    }
}

var check_consent = function(elem) {
    if (document.getElementById('consent_checkbox').checked) {
        return true;
    }
    else {
        alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
        return false;
    }
    return false;
};

// declare the consent trial block.
var consent_trial = {
    type: "html",
    url: "consent.html",
    cont_btn: "start",
    check_fn: check_consent
};


// var forward = [[2,9],[6,3],[0,8,2],[7,1,6],[3,8,0,5],[9,5,1,6],[5,4,0,3,7],[4,6,8,7,1],[3,0,8,2,7,9],[8,1,5,6,2,4],[9,0,5,3,7,5,6],[1,5,2,7,1,9,0],[6,2,9,4,6,7,3,8],[5,8,2,1,0,6,9,4],[4,7,3,9,6,2,0,8,5],[7,1,5,0,9,2,6,3,8]];
const forward = [[2,9],[6,3]];
const backward = [[6,3],[2,9]];
// const backward = [[6,3],[2,9],[7,1,6],[0,8,2],[9,5,1,6],[3,8,0,5],[4,3,8,7,1],[5,4,0,3,7],[8,1,5,6,2,4],[3,0,8,2,7,9],[1,5,2,7,1,0,9],[9,0,5,3,7,4,6],[5,8,2,1,0,6,9,4],[6,2,9,4,6,7,3,8],[7,1,5,0,9,2,6,3,8],[4,7,3,9,6,2,0,8,5]];

const forwardPractice = [[5,2],[7,3]];
const backwardPractice = [[8,1],[2,6]];
let wrongCount = 0;

function createCorsiTimeline (arrayOfRectangles) {
    var result = [];
    for (var k = 0; k < arrayOfRectangles.length; k++) {
        var stimulusObject = {
            stimulus: arrayOfRectangles[k]
        }
        result.push(stimulusObject);
    }
    return result;
}

// inserting subject ID to all trials

// var subject_id = prompt("SUBJECT ID:");
// jsPsych.data.addProperties({
//   subject: subject_id,

// });




    var checkIfMaxNumberOfWrongs = function (data) {
        console.log(data);
        if (data.correctAns == 0) {
            wrongCount++;
        } else {
            wrongCount = 0;
        }
        console.log("Wrong count: " + wrongCount);
        if (wrongCount >= 2) {
            jsPsych.endCurrentTimeline();
            wrongCount = 0;
        }
    }

  /* Instructions block for forward corsi trials */
  var corsi_instructions = {
    type: "text",
    text: corsiInst.instOne,
    timing_post_trial: 1000,
    cont_key: "enter"
  };

  /* Instructions block for reverse corsi trials */
  var reverse_corsi_instructions = {
    type: "text",
    text: corsiInst.instTwo,
    timing_post_trial: 1000,
    cont_key: "enter"
  };

function getRandomFromBucket(bucket) {
    var randomIndex = Math.floor(Math.random()*bucket.length);
    return bucket.splice(randomIndex, 1)[0];
}

jatos.onLoad(() => {
    //Initialize the trial with the consent form and instructions
    var trial_timeline = [consent_trial, corsi_instructions]
    
    //Get the trial data from JATOS JSON
    var trial_data = jatos.componentJsonInput['trial']

    //Master array for number of squares to change color in a row corsi
    var corsi_pattern_lengths = jatos.componentJsonInput['corsi_pattern_lengths']

    var lottery_values = jatos.componentJsonInput['amounts']

    var percentages = jatos.componentJsonInput['percentages']

    //Build the trials based on data in the list
    //Randomize between forward and backward
    for (trial of trial_data) {
        //First, based on the number of rectangles, build a random array of that length
        var corsi_length = corsi_pattern_lengths[trial['corsi_length']]
        var bucket = [];
        for (var i=0;i<10;i++) {
            bucket.push(i);
        }
        var corsi_squares = []
        for (let i = 0; i < corsi_length; i++) {
            corsi_squares.push(getRandomFromBucket(bucket))
        }
        // var corsi_squares = jsPsych.randomization.sampleWithoutReplacement([...Array(10).keys()], corsi_length)
        //Array.from({length: corsi_length}, () => Math.floor(Math.random() * 10)); // The 10 is hardcoded for now (number of corsi rectangles)
        console.log(corsi_squares);
        var stimulus = [{'stimulus': corsi_squares}]
        console.log(stimulus);
        //Create the corsi node
        var corsi_node = {
            type: 'plugin-corsi',
            timeline: stimulus,
            timing_response: jatos.componentJsonInput['response_time_limit'],
            color_change_time: jatos.componentJsonInput['color_change_time'],
            delay_between_squares: jatos.componentJsonInput['delay_between_squares'],
            change_color: jatos.componentJsonInput['change_color'],
            show_correct: jatos.componentJsonInput['show_correct'],
            mode: trial['order'], //WM load (lottery in between) = 1 or None = 0
            lottery_sure_bet: lottery_values[0],
            lottery_bet: lottery_values[trial['amount']],
            lottery_percentage: percentages[trial['percent']],
            // data: {
            //     block: "experiment",
            //     direction:"forward"
            // },
            on_finish: checkIfMaxNumberOfWrongs
        }
        if (Math.random() < 0.5) {
            //Forward
            corsi_node['direction'] = "forward"
        }
        else {
            corsi_node['direction'] = "backward"
        }
        trial_timeline.push(corsi_node)
    }

    /* var forwardPracticeTrial = {
        type: 'plugin-corsi',
        timeline: createCorsiTimeline(forwardPractice),
        timing_response: 7000,
        direction: "forward",
        color_change_time: jatos.componentJsonInput['color_change_time'],
        delay_between_squares: jatos.componentJsonInput['delay_between_squares'],
        data: {
            block: "practice",
            direction: "forward"
        }
    }
    
    var backwardPracticeTrial = {
        type: 'plugin-corsi',
        timeline: createCorsiTimeline(backwardPractice),
        timing_response: 7000,
        color_change_time: jatos.componentJsonInput['color_change_time'],
        delay_between_squares: jatos.componentJsonInput['delay_between_squares'],
        direction: "backward",
        data: {
            block: "practice",
            direction: "backward"
        }
    }
    var after_practice = {
        type: 'button-response',
        stimulus: corsiInst.afterPractice,
        choices: ['Repeat', 'Continue'],
        is_html: true,
        button_html: "<a class='jspsych-btn'>%choice%</a>"
    
      };
    var corsiNodeForward = {
        type: 'plugin-corsi',
        timeline: createCorsiTimeline(forward),
        timing_response: jatos.componentJsonInput['response_time_limit'],
        color_change_time: jatos.componentJsonInput['color_change_time'],
        delay_between_squares: jatos.componentJsonInput['delay_between_squares'],
        change_color: jatos.componentJsonInput['change_color'],
        show_correct: jatos.componentJsonInput['show_correct'],
        direction:"forward",
        data: {
            block: "experiment",
            direction:"forward"
        },
        on_finish: checkIfMaxNumberOfWrongs
    }
    
    var corsiNodeBackward = {
        type: 'plugin-corsi',
        timeline: createCorsiTimeline(backward),
        timing_response: jatos.componentJsonInput['response_time_limit'],
        color_change_time: jatos.componentJsonInput['color_change_time'],
        delay_between_squares: jatos.componentJsonInput['delay_between_squares'],
        change_color: jatos.componentJsonInput['change_color'],
        show_correct: jatos.componentJsonInput['show_correct'],
        direction:"backward",
        data: {
            block: "experiment",
            direction:"backward"
        },
        on_finish: checkIfMaxNumberOfWrongs
    }
    
    var practice_loop_forward = {
        timeline: [forwardPractice, after_practice],
        loop_function: function(){
            var data =  jsPsych.data.getLastTrialData()
    
            if(data.button_pressed == 0){
                return true;
            } else {
                return false;
            }
        }
    }
    
    var practice_loop_backward = {
        timeline: [backwardPractice, after_practice],
        loop_function: function(){
            var data =  jsPsych.data.getLastTrialData()
    
            if(data.button_pressed == 0){
                return true;
            } else {
                return false;
            }
        }
    } */

    jsPsych.init({
        // timeline: [ corsi_instructions, practice_loop_forward, corsiNodeForward, instructions, practice_loop_backward, corsiNodeBackward],
        timeline: trial_timeline,
        // fullscreen: true,
        default_iti: 0,
        on_finish: function() {
            var resultJson = jsPsych.data.getData();
            console.log('FINISHED')
            process_exp_data(resultJson);
        }
    });
});