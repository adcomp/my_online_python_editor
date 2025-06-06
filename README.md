# MOPE — My Online Python Editor

> **MOPE** is a Online Python Compiler/Editor to run Python directly in your browser.

---

## 🚀 Features

* ✅ Write Python directly  ( with [Ace Editor](https://ace.c9.io/) )
* ✅ Output content with HTML tag
* ✅ Built with Flask/SocketIO under the hood
* ✅ Minimal setup — no frontend frameworks or build tools needed
* ✅ Ideal for quick demos, teaching, and prototyping

---

## 📦 Prerequisites

* Python 3.11+
* Flask
* Flask-cors
* Flask-socketio

---

## ⚙️ Installation & Setup

**Clone this repository:**

   ```bash
   git clone https://github.com/adcomp/my_online_python_editor.git
   ```

**Install dependencies:**

   * for Debian / Raspberry PI

   ```bash
   sudo apt install python3-flask python3-flask-cors python3-flask-socketio python3-eventlet
   ```
   
   * with pip

   ```bash
   pip install flask flask-cors flask-socketio eventlet
   ```

**Navigate to the project folder:**

   ```bash
   cd mope
   ```


**Run the server:**

   ```bash
   python app.py
   ```

**Visit your app:**

   ```
   http://localhost:9876/editor
   ```

---

## 📁 Project Structure

```
mope/
├── templates/
│   ├── index.html       # Homepage ( empty )
│   ├── editor.html      # Python Editor
├── static/              # Any static assets (CSS, JS, images)
├── script/              # Python files ( script )
└── app.py               # Flask-based server
└── debugger.py          # bdb class to execute python code
```

---

## 🛠️ Contributing

Found a bug or have an idea?
Feel free to open an [issue](https://github.com/adcomp/my_online_python_editor/issues) or submit a pull request. Contributions welcome!

---

## 📄 License

Licensed under the [MIT License](LICENSE).

