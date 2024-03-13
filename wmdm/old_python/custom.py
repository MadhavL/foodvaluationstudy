# this file imports custom routes into the experiment server
from flask import Blueprint, render_template, request, jsonify, Response, abort, current_app, make_response
from jinja2 import TemplateNotFound
from functools import wraps
from sqlalchemy import or_, not_

from psiturk.psiturk_config import PsiturkConfig
from psiturk.experiment_errors import ExperimentError, InvalidUsage
from psiturk.user_utils import PsiTurkAuthorization, nocache

# # Database setup
from psiturk.db import db_session, init_db
from psiturk.models import Participant
from json import dumps, loads

# Helper import
from helpers import *

# load the configuration options
config = PsiturkConfig()
config.load_config()
# if you want to add a password protect route use this
myauth = PsiTurkAuthorization(config)

# explore the Blueprint
custom_code = Blueprint('custom_code', __name__,
                        template_folder='templates', static_folder='static')

# ----------------------------------------------
# Accessing data
# This simply injects data into the `list.html` template to view the users in
# the database and data about their current status.
# ----------------------------------------------
@custom_code.route('/view_data')
@myauth.requires_auth
def list_my_data():
    debug = request.args.get('debug')
    if debug:
        users = Participant.query.all()
    else:
        users = Participant.query.filter(not_(Participant.workerid.startswith('debug')))
    try:
        return render_template('list.html', participants=users)
    except TemplateNotFound:
        abort(404)


# ----------------------------------------------
# Downloading data
# This endpoint returns a CSV with the desired data type from the specified
# participant. This is used in `list.html` for each of the download buttons.
# ----------------------------------------------
@custom_code.route('/get_data')
@myauth.requires_auth
def get_data():
    workerId = request.args.get('id')
    data_type = request.args.get('dataType')
    participant = Participant.query.filter(Participant.workerid == workerId).one()
    output = make_response(get_datafile(participant, data_type))
    output.headers["Content-Disposition"] = "attachment; filename={}-{}.csv".format(workerId,data_type)
    output.headers["Content-Type"] = "text/csv"
    return output

# ----------------------------------------------
# Computing the bonus
# Use this to automatically set a bonus, which can then automatically be applied
# to a user when you approve their HIT using a script. This has to be server
# side so users can't just easily give themselves massive bonuses with inspect
# element. It's probably a good idea to provide an explicit cap on the bonus
# using a min() function call so that if a user does manage to edit their 
# experiment data, they still can't give themselves massive bonuses.
# ----------------------------------------------
@custom_code.route('/compute_bonus')
def compute_bonus():
    uniqueId = request.args['uniqueId']
    try:
        user = Participant.query.filter(Participant.uniqueid == uniqueId).one()
        user_data = loads(user.datastring)
        
        #! Your bonus computing logic here!
        # A common bonus technique is to continually save a running bonus in the
        # data and then take the last data row from the user_data object and
        # set the bonus from that.
        bonus = 0

        user.bonus = bonus
        db_session.add(user)
        db_session.commit()
        resp = {"bonusComputed": "success"}
    except:
        resp = {"bonusComputed": "failure"}
    return jsonify(**resp)