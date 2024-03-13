import json
import io
import csv

# Wraps getting question data from a participant, which for some reason
# is broken in PsiTurk 3.0.6. Not sure why.
def get_question_data(participant):
    self = participant
    questiondata = json.loads(self.datastring)["questiondata"]
    with io.StringIO() as outstring:
        csvwriter = csv.writer(outstring)
        for question in questiondata:
            csvwriter.writerow(
                (
                    self.uniqueid,
                    question,
                    questiondata[question]
                    )
            )
        return outstring.getvalue()

# Wraps getting event data from a participant, which for some reason is broken
# in PsiTurk 3.0.6. Not sure why.
def get_event_data(participant):
    self = participant
    eventdata = json.loads(self.datastring)["eventdata"]
    with io.StringIO() as outstring:
        csvwriter = csv.writer(outstring)
        for event in eventdata:
            csvwriter.writerow(
                (
                    self.uniqueid,
                    event["eventtype"],
                    event["interval"],
                    event["value"],
                    event["timestamp"]
                    )
            )
        return outstring.getvalue()

# Gets the trial data in csv (with header) format.
def get_datafile(participant, datatype):
    contents = {
        "trialdata": {
            "function": lambda p: p.get_trial_data(),
            "headerline": "uniqueid,currenttrial,time,trialData\n"        
        }, 
        "eventdata": {
            "function": lambda p: get_event_data(p),
            "headerline": "uniqueid,eventtype,interval,value,time\n"        
        }, 
        "questiondata": {
            "function": lambda p: get_question_data(p),
            "headerline": "uniqueid,questionname,response\n"
        },
        }
    ret = contents[datatype]["headerline"] + contents[datatype]["function"](participant)
    return ret
        