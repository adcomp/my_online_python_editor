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
from flask import Flask, request, jsonify, render_template

### TODO
# from flask_login import current_user

from flask_cors import CORS

# SOCKET.IO
from flask_socketio import SocketIO, Namespace, send, emit, disconnect

### need for async_mode !!!
import eventlet
eventlet.monkey_patch()


### Server config
HOST = "0.0.0.0"
PORT = 9876
DEBUG = False


### Global .. 
### FIXME !! bad  :(
thread = None
thread_lock = threading.Lock()
proc_exec_code = None
kill_proc_exec = False
SCRIPT_PATH = os.path.dirname(__file__) + "/script/"


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


### SOCKET.IO EVENT ###
@socketio.on("connect")
def handle_connect():
	""" event when client connect """
	
	print("### SOCKET : Client connected!")


@socketio.on("disconnect")
def handle_disconnect(reason):
	""" event when client disconnect """
	
	print("### SOCKET : Client disconnected:", reason)


@socketio.on("add_file")
def add_file(data):
	""" create new script with filename """
	
	filename = str(data)
	
	# replace all whitespace
	filename = filename.replace(" ", "")
	
	# check if ends with ".py"
	if not filename.endswith(".py"):
		filename += ".py"

	print("### ADD FILE : %s" % filename)

	file_realpath = SCRIPT_PATH + filename
	
	# check if file exists ..
	if os.path.exists(file_realpath):
		print("=> file already exists ..")
		return "EXIST"

	try:
		# Creates a new file
		with open(file_realpath, 'w') as fp:
			pass
	except:
		return "ERROR"
		
	return filename


@socketio.on("save_script")
def save_script(filename, code):
	""" save code to script file """
	
	### TO DO : can be done with flask route [POST] ???
	print("### SOCKET IO : save_script  = ", filename)

	file_realpath = SCRIPT_PATH + filename
	
	print("file_realpath = ", file_realpath)

	try:
		with open(file_realpath, "w") as f:
			f.write(str(code))
	except:
		print("can't open/write to file:", file_realpath)
		emit('execute_code', {"cmd":"ERROR", "data": "can't open/write to %s:" % filename}, room=sid)
		return


@socketio.on("execute_code")
def execute_code(filename, code):
	""" execute script from filename """
	
	print("### SOCKET IO : execute_code  = ", filename)
	
	sid = request.sid
	emit('execute_code', {"cmd":"START"}, room=sid)

	file_realpath = SCRIPT_PATH + filename
	
	print("file_realpath = ", file_realpath)

	try:
		with open(file_realpath, "w") as f:
			f.write(str(code))
	except:
		print("can't open/write to file:", file_realpath)
		emit('execute_code', {"cmd":"ERROR", "data": "can't open/write to %s:" % filename}, room=sid)
		return

	### -u     : force the stdout and stderr streams to be unbuffered;
	###			 this option has no effect on stdin; also PYTHONUNBUFFERED=x
	cmd = "python -u debugger.py " + filename

	global thread
	with thread_lock:
		if thread is None:
			thread = socketio.start_background_task(invoke_process, cmd)
		else:
			print("### THREAD is not none ...")


@socketio.on("stop_code")
def stop_code():
	""" stop the process running the script """
	
	print("### STOP CODE ###")
	global kill_proc_exec
	kill_proc_exec = True


@socketio.on_error_default
def default_error_handler(e):
	""" print message on error """
	
	print(request.event["message"])
	print(request.event["args"])


def ack():
	print('message was received!')



### FLASK ROUTE ###
@app.route('/')
def index():
	""" return index.html """
	return render_template('index.html')


@app.route('/editor')
def editor():
	""" return editor.html """
	return render_template('editor.html')


@app.route('/script_list')
def script_list():
	""" return an array of script in the directory """
	list_script = []
	for f in os.listdir("./script"):
		if f.endswith(".py"):
			list_script.append(f)
			
	return list_script


@app.route('/get_code', methods=['GET'])
def get_code():
	""" return script from filename """
	print("### GET CODE")
	filename = "main.py"
	
	if request.method == 'GET':
		filename = request.args.get('name', default="main.py", type=str)
	
	file_realpath = SCRIPT_PATH + filename
	print("   - ", file_realpath)
	
	try:
		with open(file_realpath, 'r') as file:
			file_content = file.read()
		return file_content
	except:
		return "can't open %s" % filename



if __name__ == '__main__':
	socketio.run(
		app,
		use_reloader=False,
		debug=DEBUG,
		port=PORT,
		host=HOST)
