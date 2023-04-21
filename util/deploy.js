// MAKE SURE THE PATH IN ENV.JS IS RIGHT BEFORE RUNNING!

import as from 'async';
import child_process from 'child_process';
import env from './env.js';
const exec = child_process.exec;

// ----------
function upload(path) {
  return new Promise(function (resolve, reject) {
    var command = 'scp -P ' + env.DEPLOY_PORT + ' ' + path + ' ' + env.DEPLOY_DEST + path;

    exec(command, function (err, stdout, stderr) {
      if (err) {
        console.log('err', err, stderr);
        reject();
      } else {
        console.log('done', path, stdout);
        resolve();
      }
    });
  });
}

// ----------
var paths = [
  'js/list.js',
  'js/main.js',
  'js/play.js',
  'lib/jquery-1.11.1.min.js',
  'lib/less-1.7.5.min.js',
  'lib/modernizr.custom.js',
  'lib/normalize.css',
  'lib/path.js',
  'lib/path.min.js',
  'lib/spin.min.js',
  'lib/underscore-1.5.0.min.js',
  'lib/velocity.min.js',
  'lib/zot.js',
  'lib/zot.subscribable.js',
  'list/index.html',
  'play/index.html',
  'style/list.less',
  'style/main.less',
  'style/play.less',
  'keys.php',
  'proxy.php'
];

as.eachSeries(
  paths,
  function (path, next) {
    upload(path).then(next);
  },
  function () {
    console.log('done');
  }
);
