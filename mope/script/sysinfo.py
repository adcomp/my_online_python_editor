import os, platform, time
from datetime import datetime
from tzlocal import get_localzone

nb = "&nbsp;"   # non-breaking space
br = "<br />"   # single line break
h1 = "<h1 style='color: DeepSkyBlue; text-align: center;'>{}</h1>"
h2 = "<h2 style='color: SpringGreen'>{}</h2>"

def sys_info():
    uname = platform.uname()
    user = os.getlogin()
    pi_temp = os.popen('vcgencmd measure_temp').readline()
    time = datetime.now().astimezone()
    
    print(h2.format("### SYSTEM ###"))
    print(nb, "User:", user)
    print(nb, "Name:", uname.node)
    print(nb, "System:", uname.system)
    print(nb, "Machine:", uname.machine)
    print(nb, "Release:", uname.release)
    print(nb, "Pi temp:", pi_temp.replace("temp=", ""))
    print(nb, f"System Time: {time.strftime('%H:%M:%S %z')}")
    print(nb, f"Timezone: {get_localzone()}")

def show_dir():
    print(h2.format("### Directory ###"))
    print("=> Current:", os.getcwd())
    
    print("=> list:")
    for i in os.listdir("."):
        print(nb, i)

    df = os.popen("df -h /").read()
    print("=> Disk space:")
    print(df)

def main():
    print(h1.format("Hello, World!"))
    time.sleep(2)
    sys_info()
    time.sleep(2)
    print(br)
    show_dir()
    time.sleep(2)
    print(h1.format("... the end ..."))

main()
