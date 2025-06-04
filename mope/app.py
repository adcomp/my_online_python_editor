#!/usr/bin/python3

### Flask Code Editor / Python Interpreter
### by David Art [aka] ADcomp

import os
import sys
import time
import json
import subprocess
import shlex
import threading

# Flask import
from flask import Flask, request, jsonify, render_template, Blueprint
from flask_login import current_user
from flask_cors import CORS
from flask_socketio import SocketIO, Namespace, send, emit, disconnect

### need for async_mode !!!
import eventlet
eventlet.monkey_patch()


### FIXME : filename for code execution ..
FILE_PATH = os.path.dirname(__file__) + "/script/"
FILE_NAME = "main.py"
FILE_REALPATH = FILE_PATH + FILE_NAME


### Server config
HOST = "0.0.0.0"
PORT = 9876
DEBUG = True


### Global .. bad  :(
### FIXME !!
thread = None
thread_lock = threading.Lock()
proc_exec_code = None
kill_proc_exec = False


### Flask APP
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins='*', async_mode="eventlet")



def invoke_process(command):
	"""runs subprocess with Popen/poll so that live stdout is shown"""

	global proc_exec_code
	global thread
	global kill_proc_exec

	try:
		proc_exec_code = subprocess.Popen(
			shlex.split(command), 
			shell=False,
			encoding='utf-8',
			bufsize=0,
			stdout=subprocess.PIPE)

		while proc_exec_code.poll() is None:
			if kill_proc_exec:
				proc_exec_code.kill()
				socketio.emit('execute_code', {"cmd":"OUTPUT", "data": "--- STOP PROCESS ---"})
				break
			line = proc_exec_code.stdout.readline()
			if line.startswith("@~ "): # line number
				socketio.emit('execute_code', {"cmd":"LINENO", "data": line.replace("@~ ", "")})
			else:
				# script stdout
				# ~ print(line)
				socketio.emit('execute_code', {"cmd":"OUTPUT", "data": line})

	except:
		line = "ERROR {} while running {}".format(sys.exc_info()[1])
		print(line, command)
		socketio.emit('execute_code', {"cmd":"ERROR", "data": line})
		socketio.emit('execute_code', {"cmd":"END", "data": ""})
		proc_exec_code = None
		thread = None
		return None

	# reset => stop
	socketio.emit('execute_code', {"cmd":"END", "data": ""})
	
	rc = proc_exec_code.poll()
	proc_exec_code = None
	thread = None
	kill_proc_exec = False
	
	return rc


@socketio.on("connect")
def handle_connect():
	print("### SOCKET : Client connected!")


@socketio.on("disconnect")
def handle_disconnect(reason):
	print("### SOCKET : Client disconnected:", reason)


@socketio.on("execute_code")
def execute_code(code):
	print("### SOCKET IO : execute_code ...")
	
	sid = request.sid
	emit('execute_code', {"cmd":"START"}, room=sid)

	try:
		with open(FILE_REALPATH, "w") as f:
			f.write(str(code))
	except:
		print("can't open/write to file:", FILE_REALPATH)
		emit('execute_code', {"cmd":"ERROR", "data": "can't open/write to %s:" % FILE_REALPATH}, room=sid)
		return

	### -u     : force the stdout and stderr streams to be unbuffered;
	###			 this option has no effect on stdin; also PYTHONUNBUFFERED=x
	cmd = "python -u debugger.py " + FILE_NAME

	global thread
	with thread_lock:
		if thread is None:
			thread = socketio.start_background_task(invoke_process, cmd)
		else:
			print("### THREAD is not none ...")


@socketio.on("stop_code")
def stop_code():
	print("### STOP CODE ###")
	global kill_proc_exec
	kill_proc_exec = True


@socketio.on_error_default
def default_error_handler(e):
	print(request.event["message"]) # "my error event"
	print(request.event["args"])    # (data,)


def ack():
	print('message was received!')



### FLASK ROUTE ###
@app.route('/editor')
def editor():
	return render_template('editor.html')


@app.route('/')
def index():
	return render_template('index.html')


@app.route('/get_code')
def get_code():
	with open(FILE_REALPATH, 'r') as file:
		file_content = file.read()
	return file_content


if __name__ == '__main__':
	socketio.run(app, use_reloader=False, debug=DEBUG, port=PORT, host=HOST)

	
