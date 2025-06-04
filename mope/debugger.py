import bdb
import inspect
import os
import sys
import time
import signal
import traceback


FILE_PATH = os.path.dirname(__file__) + "/script/"


class Debugger(bdb.Bdb):

	# https://docs.python.org/3/library/bdb.html#module-bdb

	def hprint(self, frame, *args, **kwargs):
		if frame.f_code.co_filename == self.script:
			# ~ print(f'{os.path.basename(frame.f_code.co_filename)}: {frame.f_lineno} :')
			print("@~", frame.f_lineno)
			# ~ time.sleep(0.1)

	def user_call(self, frame, arg):
		self.hprint(frame)

	def user_line(self, frame):
		self.hprint(frame)
		
	def user_return(self, frame, value):
		self.hprint(frame)


def main(script):
	
	debugger = Debugger()
	debugger.script = script

	### Open script to execute
	try:
		content = open(script, "r").read()
	except Exception as err:
		print("can't open script ..")
		print(f"Unexpected {err=}, {type(err)=}")
		exit(1)
	
	### Compile 
	try:
		compile_code = compile(content, script, "exec")
	except Exception as err:
		print("can't compile script ..")
		print(f"Unexpected {err=}, {type(err)=}")
		exit(1)
	
	### Debug 
	try:
		debugger.run(compile_code, globals={"__name__": "__main__", "__file__": str(script)} , locals=None)
	except Exception as err:
		print("### DEBUGGER ###")
		print(traceback.format_exc())
		print(err.__traceback__)


def handler(signum, frame):
    exit(1)


if __name__ == "__main__":
	
	# grab CTRL-C
	signal.signal(signal.SIGINT, handler)
	
	filename = None
	
	# check for filenam as argument 
	if len(sys.argv) > 2:
		print("too much arguments ..", str(sys.argv))
		exit(1)
	elif len(sys.argv) == 1:
		print("no script name to execute ..")
		exit(1)
	else:
		filename = sys.argv[1]
	
	# check if script exists ..
	if not os.path.exists(FILE_PATH + filename):
		print("script doesn't exists ..")
		print("file:", FILE_PATH + filename)
		exit(1)
		
	main(FILE_PATH + filename)
