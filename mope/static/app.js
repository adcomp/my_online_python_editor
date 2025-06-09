
// configure ACE (Editor)
var editor_font_size = 14;
var editor = null;

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
	$("#bt_run").prop(
		"disabled",
		false
	);
	$("#bt_files").removeClass("hidden");
});

// Socket disconnect callback
socket.on("disconnect", () => {
	console.log("disconnected");
	$("#socketio_status").removeClass("connected");
	$("#socketio_status").addClass("disconnected");
	$("#bt_run").prop(
		"disabled",
		true
	);
	$("#bt_files").addClass("hidden");
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
		console.log("get code for :" + filename + " = ", status);
		console.log(data)
		//~ editor.setValue(data, 1)
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


$("#bt_output_toggle").click(function () { 
	$("#output_box").toggle();
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


// TODO : just a test ..
$("#bt_dbg").click(function() {
	socket.emit("test", function(data) {
		console.log("test", data);
		});
});

// TODO : just a test ..
// $("#bt_test").click(function() { );


function update_bt_file_event() {
	$(".bt_file").on('click', function(event){

		event.stopPropagation();
		event.stopImmediatePropagation();

		var filename = $(this).text();
		$(".bt_file").removeClass("selected");
		$(this).addClass("selected");
		//~ console.log('filename:', filename);
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
	socket.emit("add_file", filename, function(data) {
		// console.log("add_file : " + filename, data);

		if (data == "ERROR") {
			console.log("ERROR: can't write to file");
			$("#add_file_error").text("ERROR: can't write to file");
			}
		else if (data == "EXIST") {
			console.log("FILE ALREADY EXISTS ..")
			$("#add_file_error").text("FILE ALREADY EXISTS ..");
			}
		else {
			$("#modal_addfile").css("display", "none");
			// add new button to panel files
			$("#list_files").append(
			'<button class="bt_big bt_dark bt_file">' + data + '</button>'
			);
			update_bt_file_event();
			}
			
		});
});

$("#modal_close").click(function() {
	$("#modal_addfile").css("display", "none");
});


// Keybind ( F8 )
window.onkeydown = function(evt) {
	if (evt.keyCode == 119) //F8
		run_code();
};

// Get the code from server when page is loaded
$(document).ready(function() {
	configure_editor()
	get_code();
	update_bt_file_event();
	
});

