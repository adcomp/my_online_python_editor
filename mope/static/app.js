
// configure ACE (Editor)
var editor_font_size = 14;
var editor = null;

// global variables
var script_is_running = false;



function configure_editor() {
	editor = ace.edit("editor")
	editor.setTheme("ace/theme/dracula");
	editor.session.setMode("ace/mode/python");
	editor.setFontSize(editor_font_size + " px");
	$("#editor_font_size").text(editor_font_size + " px")

	// need "plugins"
	editor.setOption("enableBasicAutocompletion", true);
	editor.setOption("enableLiveAutocompletion", true);
};


// SocketIO
const socket = io(); 

// Socket connect callback
socket.on("connect", () => {
	console.log("connected");
	$("#socketio_status").removeClass("disconnected");
	$("#socketio_status").addClass("connected");
	$("#bt_run").prop("disabled", false);
	$("#bt_save").prop("disabled", false);
	$("#bt_files").removeClass("hidden");
});

// Socket disconnect callback
socket.on("disconnect", () => {
	console.log("disconnected");
	$("#socketio_status").removeClass("connected");
	$("#socketio_status").addClass("disconnected");
	$("#bt_run").prop("disabled", true);
	$("#bt_save").prop("disabled", true);
	$("#bt_files").addClass("hidden");
});


// Socket onError callback
socket.on("error", function(msg) {
	console.log(msg);
});


// Event sent by Server when running code
socket.on("execute_code", function(msg) {
	
	if (msg.cmd == "CLEAR") {
		$("#output").empty();
		}
	
	if (msg.cmd == "RUN_CODE") {
		console.log("### SOCKET : RUN CODE");
		}
	
	if (msg.cmd == "LINENO") {
		editor.gotoLine(msg.data, 1, true);
		}
		
	if (msg.cmd == "OUTPUT") {
		append_output(msg.data);
		}

	if (msg.cmd == "ERROR") {
		append_output("--- ERROR ---", "error");
		append_output(msg.data);
		$("#bt_run").text("run");
		}

	if (msg.cmd == "END") {
		append_output("--- END PROCESS ---", "end")
		$("#bt_run").text("run");
		}
});


// get scripts list from server
function get_script_list() {
	console.log("get script list");
	
	$.get("script_list", function(data, status){
		for (var i=0; i<data.length; i++) {
			var name = data[i];
			if (name != "main.py") {
				add_button_file(name);
			}
		}
	})
};


function add_button_file(name) {
	var $btn = $("<button>", {"class": "bt_big bt_dark bt_file", "text": name});
	$btn.click(function(){
		if ($(this).hasClass("selected")) { return; }
		var filename = $(this).text();
		$(".bt_file").removeClass("selected");
		$(this).addClass("selected");
		get_code(filename)
	});
	$("#list_files").append($btn);
};


// append data to output tag
function append_output(data, type) {
	if (data == "") { data = "<br />"; }
	
	if (type == undefined) {
		$("#output").append("<p>" + data + "</p>");
	}
	else {
		$("#output").append('<p class="' + type + '">' + data + "</p>");
	}
}


// Send code to server Or ask to stop ..
function run_code() {
	if ($("#bt_run").text() == "run") {
		$("#bt_run").text("stop");
		$("#output").text("");
		var code = editor.getValue();
		var filename = $("#editor_filename").text()
		socket.emit("execute_code", filename, code);
		}
	else {
		$("#bt_run").text("run");
		socket.emit("stop_code");
	}
}


// Get code from server and paste into editor
function get_code(filename="main.py") {

	$.get("get_code", { "name": filename }, function(data, status){
		editor.session.setValue(data)
		$("#editor_filename").text(filename)
	});
}


// set Editor theme
function set_editor_theme(theme) {
	editor.setTheme("ace/theme/" + theme);
}


// Button "clear"
$("#bt_clear").click(function() {
	$("#output").empty();
	}
);


// Button "run"
$("#bt_run").click(function() { 
	run_code();
	}
);


// Button "save"
$("#bt_save").click(function() {
	console.log("save script ..");
		var code = editor.getValue();
		var filename = $("#editor_filename").text();
		socket.emit("save_script", filename, code);
	}
);


// Button "toggle_sidebar"
$("#toggle_sidebar").click(function() {
	$("#sidebar_panel").addClass("hidden");
	$("#toggle_sidebar").addClass("hidden");
});


function toggle_sidebar_panel() {
	is_sidebar_hidden = $("#sidebar_panel").hasClass("hidden");
	if (is_sidebar_hidden) {
		$("#sidebar_panel").removeClass("hidden");
		$("#toggle_sidebar").removeClass("hidden");
		}
	else {
		$("#sidebar_panel").addClass("hidden");
		$("#toggle_sidebar").addClass("hidden");
		}
};


// Button "bt_files"
$("#bt_files").click(function() {
	is_sidebar_hidden = $("#sidebar_panel").hasClass("hidden");
	is_panel_files_hidden = $("#panel_files").hasClass("hidden");
	
	// panel hidden
	if (is_sidebar_hidden) {
		$("#panel_settings").addClass("hidden");
		$("#panel_files").removeClass("hidden");
		toggle_sidebar_panel();
		}
	else if (is_panel_files_hidden) { 
		$("#panel_settings").addClass("hidden");
		$("#panel_files").removeClass("hidden");
		}
	else {
		toggle_sidebar_panel();
		}
});


// Button "bt_settings"
$("#bt_settings").click(function() {
	is_sidebar_hidden = $("#sidebar_panel").hasClass("hidden");
	is_panel_settings_hidden = $("#panel_settings").hasClass("hidden");
	
	// panel hidden
	if (is_sidebar_hidden) {
		$("#panel_files").addClass("hidden");
		$("#panel_settings").removeClass("hidden");
		toggle_sidebar_panel();
		}
	else if (is_panel_settings_hidden) { 
		$("#panel_files").addClass("hidden");
		$("#panel_settings").removeClass("hidden");
		}
	else {
		toggle_sidebar_panel();
		}
});



$("#editor_resize").on('input change', function() {
	set_editor_width($(this).val())
});


$("#editor_theme").on( "change", function() {
	console.log("change editor theme :" + this.value)
	editor.setTheme("ace/theme/" + this.value);
} );


$("#bt_font_m").click(function () { 
	if (editor_font_size > 10) {
		editor_font_size -= 2;
		editor.setFontSize(editor_font_size + "px");
		$("#editor_font_size").text(editor_font_size + " px")
		}
});


$("#bt_font_p").click(function () { 
	if (editor_font_size < 72) {
		editor_font_size += 2;
		editor.setFontSize(editor_font_size + "px");
		$("#editor_font_size").text(editor_font_size + " px")
		}
});


$("#bt_output_toggle").click(function () {
	if ( ! $("#pythondoc_box").hasClass("hidden") ) {
		$("#pythondoc_box").addClass("hidden");
		}
	$("#output_box").toggleClass("hidden");
});


$("#bt_fullscreen").click(function () { 
	if (document.fullscreenElement) {
		// If there is a fullscreen element, exit full screen.
		document.exitFullscreen();
		return;
	}
	document.querySelector(".app").requestFullscreen();
});


$("#bt_show_doc").click(function() {
	if ( ! $("#output_box").hasClass("hidden") ) {
		$("#output_box").addClass("hidden");
		}
	$("#pythondoc_box").toggleClass("hidden");
});


// TODO : just a test ..
$("#bt_dbg").click(function() {
	socket.emit("test", function(data) {
		console.log("test", data);
		});
});


// Download script
$("#bt_download").click(function() {
    let valueinput = editor.getValue();
	let filename = $("#editor_filename").text()
    let blobdtMIME = new Blob([valueinput], { type: "text/plain" })
    let url = URL.createObjectURL(blobdtMIME)
    let anele = document.createElement("a")
    anele.setAttribute("download", "Downloaded Successfully");
    anele.href = url;
    anele.download = filename;
    anele.click();
    //~ console.log(blobdtMIME)
});


$("#bt_pythondoc_reload").click(function() {
	//~ $("#python_doc").contentWindow.location.reload(true);
	$("#python_doc").attr('src', $("#python_doc").attr('src'));
});


function update_bt_file_event() {
	$(".bt_file").on('click', function(event){
		
		if ($(this).hasClass("selected")) { return; }

		event.stopPropagation();
		event.stopImmediatePropagation();

		var filename = $(this).text();
		$(".bt_file").removeClass("selected");
		$(this).addClass("selected");
		get_code(filename)	
	});
};


// Button Add File ( open modal window )
$("#add_file").click(function() {
	$("#modal_addfile").css("display", "block");
});


// Button (model) add file
$("#bt_mod_add_file").click(function() {
	filename = $("#new_filename").val();
	socket.emit("add_file", filename, function(name) {

		if (name == "ERROR") {
			console.log("ERROR: can't write to file");
			$("#add_file_error").text("ERROR: can't write to file");
			}
		else if (name == "EXIST") {
			console.log("FILE ALREADY EXISTS ..")
			$("#add_file_error").text("FILE ALREADY EXISTS ..");
			}
		else {
			$("#modal_addfile").css("display", "none");
			// add new button to panel files
			add_button_file(name);
			}
			
		});
});

$("#modal_close").click(function() {
	$("#modal_addfile").css("display", "none");
});


function app_log(txt) {
	if (DEBUG) {
		console.log(txt);
		}
};

// Keybind ( F8 )
window.onkeydown = function(evt) {
	if (evt.keyCode == 119) //F8
		run_code();
};

// Get the code from server when page is loaded
$(document).ready(function() {
	get_script_list();
	configure_editor();
	get_code();
	update_bt_file_event();
});


