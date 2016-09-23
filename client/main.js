import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

Fiddles = new Mongo.Collection('fiddles');

import './main.html';

Session.set('loveLoaded', false);
Session.set('isLoading', false);
Session.set('isGameSaved', true);
Session.set('isGameRunning', false);

var editor;
var log;
var Module;

//Module

function initModule() {
  Module = {
    arguments: ['./'],
    preRun: [],
    postRun: [],
    printErr: function(text) {
      console.log("Error: " + text);
    },
    print: function(text) {
      var output = document.getElementById('output');
      output.innerHTML += ">" + text + "<br/>";
      output.scrollTop = output.scrollHeight - output.clientHeight;
    },
    canvas: (function() {
      canvas = document.getElementById('canvas');
      canvas.addEventListener("webglcontextlost", function(e) { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);
      return canvas;
    })(),
    setStatus: function(text) {
      if (text) {
        document.getElementById('canvas').style.display = 'block';
      }
    },
    totalDependencies: 0,
    monitorRunDependencies: function(left) {
      //
    },
    noInitialRun: true
  };
  window.onerror = function(event) {
    // TODO: do not warn on ok events like simulating an infinite loop or exitStatus
    Module.setStatus('Exception thrown, see JavaScript console');
    Module.setStatus = function(text) {
      if (text) Module.printErr('[post-exception status] ' + text);
    };
  };
  Module.setStatus("Downloading...");
  window.Module = Module;
}

//spinner

Meteor.Spinner.options = {
  lines: 13, // The number of lines to draw
  length: 6, // The length of each line
  width: 3, // The line thickness
  radius: 12, // The radius of the inner circle
  corners: 0.7, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#fff', // #rgb or #rrggbb
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: true, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: '50%', // Top position relative to parent in px
  left: '50%' // Left position relative to parent in px
};

Template.main.helpers({
  isLoading() {
    return Session.get('isLoading');
  }
});

Template.main.onRendered(() => {

  Split(['#editor', '#right'], {
    sizes: [50, 50],
    minSize: 200,
    cursor: 'col-resize'
  });

  Split(['#game', '#output'], {
    sizes: [75, 25],
    minSize: [250, 100],
    cursor: 'col-resize',
    direction: 'vertical'
  });

  initModule();

  Router.dispatch = function () {}; //TAKE THIS MOTHERF***ING ROUTER

  $.getScript('/love.js', function() {
    Session.set('loveLoaded', true);
  });

})

//nav

Template.nav.helpers({
  loveLoaded() {
    return Session.get('loveLoaded');
  },
  isGameSaved() {
    return Session.get('isGameSaved');
  },
  isGameRunning() {
    return Session.get('isGameRunning');
  }
});

Template.nav.events({
  'change #theme-picker'(event) {
    if ($(event.target).val() == "Dark") {
      editor.setTheme("ace/theme/monokai");
    } else {
      editor.setTheme("ace/theme/chrome");
    };
  },
  'click .save-button'(event) {
    Session.set('isLoading', true);
    Meteor.call('fiddle.save', editor.getValue(), (err, fiddle) => {
      if (err)
        console.log("Error: " + err);

      console.log("Saved fiddle #" + fiddle);
      history.pushState({}, "fiddle", fiddle);
      Session.set('isGameSaved', true);
      Session.set('isLoading', false);
    });
  },
  'click .run-button'(event) {
    if (!Session.get('isGameRunning')) {

      codeString = editor.getValue();
      FS.writeFile('/main.lua', codeString);
      Module.callMain(Module.arguments);
      Session.set('isGameRunning', true);

    } else {

      try {
        Browser.mainLoop.pause();
        Browser.mainLoop.func = null;
        Module['noExitRuntime'] = false;
        Module['exit'](0);
        FS.unlink('/main.lua');
      } catch (e) {
        console.log(e);
      }

      Session.set('isGameRunning', false);
      Session.set('loveLoaded', false);

      document.getElementById('game').removeChild(document.getElementById('canvas'));
      document.getElementById('game').innerHTML = '<canvas id="canvas" oncontextmenu="event.preventDefault()"></canvas>';

      initModule();
      $.getScript('/love.js', function() {
        Session.set('loveLoaded', true);
      });

    }
  }
});

//code editor

Template.leftPanel.onRendered(() => {

  editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/lua");
  editor.on('change', () => {
    Session.set('isGameSaved', false);
  });

  /*
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
  });
  */

});

Template.rightPanel.onRendered(() => {
  //
});

//love game


//misc

window.onbeforeunload = function() {
  if (!Session.get('isGameSaved'))
    return "Do you want to leave? Changes you made may not be saved.";
};
